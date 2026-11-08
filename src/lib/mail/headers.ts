import type { MailHeader } from './types';

/** Parse a raw header block (or a whole message: parsing stops at the first blank line). */
export function parseHeaderBlock(raw: string): MailHeader[] {
  const out: MailHeader[] = [];
  const text = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  for (const line of text.split('\n')) {
    if (line.trim() === '') { if (out.length) break; else continue; }
    if (/^[ \t]/.test(line) && out.length) { out[out.length - 1].value += ' ' + line.trim(); continue; }
    const i = line.indexOf(':');
    // Skip mbox "From " lines and anything that is not a header
    if (i > 0 && /^[!-9;-~]+$/.test(line.slice(0, i))) out.push({ key: line.slice(0, i), value: line.slice(i + 1).trim() });
  }
  return out;
}

export interface Hop {
  index: number;
  from: string;
  by: string;
  protocol: string;
  id: string;
  forAddr: string;
  ips: string[];
  date?: Date;
  rawDate: string;
  /** Milliseconds since the previous hop, when both have dates. */
  delay?: number;
}

const strip = (s: string) => s.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();

function parseReceived(value: string): Omit<Hop, 'index' | 'delay'> {
  const semi = value.lastIndexOf(';');
  const body = semi >= 0 ? value.slice(0, semi) : value;
  const rawDate = semi >= 0 ? value.slice(semi + 1).trim() : '';
  const clause = (re: RegExp) => body.match(re)?.[1]?.trim() ?? '';
  const from = clause(/\bfrom\s+(.+?)(?=\s+(?:by|with|via|id|for)\s|$)/i);
  const by = clause(/\bby\s+(.+?)(?=\s+(?:with|via|id|for|from)\s|$)/i);
  const ips = new Set<string>();
  for (const m of body.matchAll(/\[(?:IPv6:)?([0-9a-fA-F:.]{3,45})\]/g)) ips.add(m[1]);
  for (const m of body.matchAll(/\((?:[^)]*?\s)?((?:\d{1,3}\.){3}\d{1,3})\)/g)) ips.add(m[1]);
  let date: Date | undefined;
  if (rawDate) {
    const d = new Date(strip(rawDate));
    if (!Number.isNaN(d.getTime())) date = d;
  }
  return {
    from: strip(from) || from, by: strip(by) || by,
    protocol: clause(/\bwith\s+([A-Za-z0-9_-]+)/i), id: clause(/\bid\s+([^\s;]+)/i),
    forAddr: clause(/\bfor\s+<?([^\s;>]+)/i), ips: [...ips], date, rawDate,
  };
}

export type Verdict = 'pass' | 'fail' | 'softfail' | 'neutral' | 'none' | 'temperror' | 'permerror' | 'policy' | 'unknown';

export interface AuthResult { method: 'spf' | 'dkim' | 'dmarc' | 'arc'; result: Verdict; detail: string; source: string }

export interface Flag { level: 'bad' | 'warn' | 'info'; text: string }

export interface Analysis {
  summary: { label: string; value: string }[];
  hops: Hop[];
  auth: AuthResult[];
  flags: Flag[];
  dkimSignatures: { domain: string; selector: string; algorithm: string }[];
  totalMs?: number;
}

const get = (h: MailHeader[], k: string) => h.filter((x) => x.key.toLowerCase() === k.toLowerCase());
const first = (h: MailHeader[], k: string) => get(h, k)[0]?.value ?? '';

export function domainOf(addr: string): string {
  const m = addr.match(/@([A-Za-z0-9.-]+)/);
  return m ? m[1].toLowerCase() : '';
}
const rootDomain = (d: string) => d.split('.').slice(-2).join('.');
const sameOrg = (a: string, b: string) => !a || !b || rootDomain(a) === rootDomain(b);

function parseAuth(headers: MailHeader[]): AuthResult[] {
  const out: AuthResult[] = [];
  const verdicts = new Set(['pass', 'fail', 'softfail', 'neutral', 'none', 'temperror', 'permerror', 'policy']);
  for (const h of headers) {
    const k = h.key.toLowerCase();
    if (k === 'authentication-results' || k === 'arc-authentication-results') {
      // Split on ';' into method results: "spf=pass (comment) smtp.mailfrom=x"
      for (const part of h.value.split(';')) {
        const m = part.trim().match(/^(?:i=\d+;?\s*)?(spf|dkim|dmarc|arc)=([a-z]+)\s*(.*)$/i);
        if (!m) continue;
        const method = m[1].toLowerCase() as AuthResult['method'];
        if (k === 'arc-authentication-results' && method !== 'arc') continue;
        const v = m[2].toLowerCase();
        out.push({ method, result: (verdicts.has(v) ? v : 'unknown') as Verdict, detail: m[3].replace(/\s+/g, ' ').trim(), source: h.key });
      }
    } else if (k === 'received-spf') {
      const m = h.value.match(/^\s*([a-z]+)\s*(.*)$/i);
      if (m) out.push({ method: 'spf', result: (verdicts.has(m[1].toLowerCase()) ? m[1].toLowerCase() : 'unknown') as Verdict, detail: m[2].replace(/\s+/g, ' ').trim(), source: h.key });
    }
  }
  return out;
}

export function analyze(headers: MailHeader[]): Analysis {
  const received = get(headers, 'Received');
  // The topmost Received is the last hop; reverse for the order the message travelled.
  const hops: Hop[] = received.map((h) => parseReceived(h.value)).reverse().map((h, i) => ({ ...h, index: i + 1 }));
  for (let i = 1; i < hops.length; i++) {
    const a = hops[i - 1].date, b = hops[i].date;
    if (a && b) hops[i].delay = b.getTime() - a.getTime();
  }
  const dated = hops.filter((h) => h.date);
  const totalMs = dated.length > 1 ? dated[dated.length - 1].date!.getTime() - dated[0].date!.getTime() : undefined;

  const auth = parseAuth(headers);
  const dkimSignatures = get(headers, 'DKIM-Signature').map((h) => {
    const tag = (t: string) => h.value.match(new RegExp(`(?:^|;)\\s*${t}=([^;]+)`))?.[1]?.trim() ?? '';
    return { domain: tag('d'), selector: tag('s'), algorithm: tag('a') };
  });

  const from = first(headers, 'From');
  const returnPath = first(headers, 'Return-Path');
  const replyTo = first(headers, 'Reply-To');
  const msgId = first(headers, 'Message-ID');
  const fromDom = domainOf(from);

  const summary = [
    { label: 'Subject', value: first(headers, 'Subject') },
    { label: 'From', value: from },
    { label: 'To', value: first(headers, 'To') },
    { label: 'Date', value: first(headers, 'Date') },
    { label: 'Message-ID', value: msgId },
    { label: 'Return-Path', value: returnPath },
    { label: 'Reply-To', value: replyTo },
    { label: 'Sent with', value: first(headers, 'X-Mailer') || first(headers, 'User-Agent') },
  ].filter((r) => r.value);

  const flags: Flag[] = [];
  for (const m of ['spf', 'dkim', 'dmarc'] as const) {
    const rs = auth.filter((a) => a.method === m);
    if (!rs.length) continue;
    const bad = rs.find((r) => r.result === 'fail' || r.result === 'permerror');
    const warn = rs.find((r) => ['softfail', 'temperror', 'neutral', 'none'].includes(r.result));
    if (bad) flags.push({ level: 'bad', text: `${m.toUpperCase()} ${bad.result}: the receiving server could not confirm this message is authentic.` });
    else if (warn && !rs.some((r) => r.result === 'pass')) flags.push({ level: 'warn', text: `${m.toUpperCase()} result is “${warn.result}”.` });
  }
  if (!auth.length) flags.push({ level: 'info', text: 'No authentication results in these headers (SPF, DKIM, DMARC). They are added by the receiving server, so they may have been removed or never present.' });
  const rpDom = domainOf(returnPath);
  if (fromDom && rpDom && !sameOrg(fromDom, rpDom)) flags.push({ level: 'warn', text: `The envelope sender (Return-Path, ${rpDom}) is a different domain from From (${fromDom}). Mailing services do this legitimately, but so do spoofers.` });
  const rtDom = domainOf(replyTo);
  if (fromDom && rtDom && !sameOrg(fromDom, rtDom)) flags.push({ level: 'warn', text: `Replies go to a different domain (${rtDom}) than the sender (${fromDom}).` });
  const idDom = domainOf(msgId);
  if (fromDom && idDom && !sameOrg(fromDom, idDom)) flags.push({ level: 'info', text: `The Message-ID domain (${idDom}) differs from the From domain (${fromDom}).` });
  if (dkimSignatures.length && fromDom && !dkimSignatures.some((s) => sameOrg(s.domain, fromDom))) flags.push({ level: 'warn', text: `DKIM is signed by ${dkimSignatures.map((s) => s.domain).join(', ')}, not the From domain, so it does not align for DMARC.` });
  const slow = hops.reduce<Hop | undefined>((m, h) => ((h.delay ?? 0) > (m?.delay ?? 0) ? h : m), undefined);
  if (slow && slow.delay! > 60_000) flags.push({ level: 'info', text: `The longest delay was ${formatDelay(slow.delay!)}, before hop ${slow.index}${slow.by ? ` (${slow.by})` : ''}.` });
  if (hops.some((h) => (h.delay ?? 0) < -1000)) flags.push({ level: 'info', text: 'Some hop timestamps run backwards, which means a server clock is out of sync.' });
  if (!received.length) flags.push({ level: 'info', text: 'No Received headers were found, so the delivery path cannot be traced.' });

  return { summary, hops, auth, flags, dkimSignatures, totalMs };
}

export function formatDelay(ms: number): string {
  const sign = ms < 0 ? '-' : '';
  let s = Math.round(Math.abs(ms) / 1000);
  if (s < 1) return ms === 0 ? '0 s' : `${sign}<1 s`;
  const parts: string[] = [];
  for (const [n, label] of [[86400, 'd'], [3600, 'h'], [60, 'min'], [1, 's']] as const) {
    if (s >= n) { parts.push(`${Math.floor(s / n)} ${label}`); s %= n; }
  }
  return sign + parts.slice(0, 2).join(' ');
}
