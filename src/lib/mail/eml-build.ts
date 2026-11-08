import type { MailAddress, MailAttachment, ParsedMail } from './types';

const enc = new TextEncoder();
const CRLF = '\r\n';

function toB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const wrap = (s: string, n = 76) => (s.match(new RegExp(`.{1,${n}}`, 'g')) ?? []).join(CRLF);

/** Quoted-printable (RFC 2045) for UTF-8 text with soft line breaks at 76 columns. */
function qp(text: string): string {
  const bytes = enc.encode(text.replace(/\r\n?|\n/g, '\n'));
  const lines: string[] = [];
  let line = '';
  const push = (chunk: string) => {
    if (line.length + chunk.length > 75) { lines.push(line + '='); line = ''; }
    line += chunk;
  };
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 10) {
      // trailing whitespace before a hard break must be encoded
      if (line.endsWith(' ') || line.endsWith('\t')) { const last = line.slice(-1); line = line.slice(0, -1); push(`=${last.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`); }
      lines.push(line); line = ''; continue;
    }
    const printable = (b >= 33 && b <= 126 && b !== 61) || b === 32 || b === 9;
    push(printable ? String.fromCharCode(b) : `=${b.toString(16).toUpperCase().padStart(2, '0')}`);
  }
  lines.push(line);
  return lines.join(CRLF);
}

/** RFC 2047 encoded-word for header text that is not plain ASCII. */
function encodeWord(s: string): string {
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  const words: string[] = [];
  let chunk = '';
  for (const ch of s) {
    if (enc.encode(chunk + ch).length > 42) { words.push(chunk); chunk = ''; }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${toB64(enc.encode(w))}?=`).join(' ');
}

const quoteName = (n: string) => (/^[\w !#$%&'*+\-/=?^`{|}~]+$/.test(n) ? n : `"${n.replace(/(["\\])/g, '\\$1')}"`);
function formatAddr(a: MailAddress): string {
  if (!a.name) return a.address;
  const n = /^[\x20-\x7e]*$/.test(a.name) ? quoteName(a.name) : encodeWord(a.name);
  return `${n} <${a.address}>`;
}
const addrList = (l: MailAddress[]) => l.map(formatAddr).join(', ');

function fold(key: string, value: string): string {
  const out: string[] = [];
  let line = `${key}:`;
  for (const w of value.split(' ')) {
    if (line.length + 1 + w.length > 76 && line.length > key.length + 1) { out.push(line); line = ' ' + w; }
    else line += (line.endsWith(':') ? ' ' : ' ') + w;
  }
  out.push(line);
  return out.join(CRLF);
}

const SKIP = new Set(['content-type', 'content-transfer-encoding', 'content-disposition', 'content-id', 'content-length', 'mime-version',
  'date', 'from', 'to', 'cc', 'bcc', 'subject', 'message-id', 'reply-to', 'dkim-signature']);

const boundary = () => '----=_Part_' + [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, '0')).join('');

function textPart(type: string, body: string): string {
  return `Content-Type: ${type}; charset=utf-8${CRLF}Content-Transfer-Encoding: quoted-printable${CRLF}${CRLF}${qp(body)}`;
}

function filePart(a: MailAttachment, inline: boolean): string {
  const name = encodeWord(a.filename);
  const quoted = /^[\x20-\x7e]*$/.test(name) ? `"${name.replace(/"/g, "'")}"` : `"${name}"`;
  const lines = [
    `Content-Type: ${a.mimeType || 'application/octet-stream'}; name=${quoted}`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: ${inline ? 'inline' : 'attachment'}; filename=${quoted}`,
  ];
  if (a.contentId) lines.push(`Content-ID: <${a.contentId}>`);
  return lines.join(CRLF) + CRLF + CRLF + wrap(toB64(new Uint8Array(a.data)));
}

function multipart(sub: string, parts: string[]): { header: string; body: string } {
  const b = boundary();
  return {
    header: `Content-Type: multipart/${sub}; boundary="${b}"`,
    body: parts.map((p) => `--${b}${CRLF}${p}`).join(CRLF) + `${CRLF}--${b}--`,
  };
}

/** Turn a parsed message into RFC 5322 / MIME text. */
export function buildEml(mail: ParsedMail): Uint8Array {
  const head: string[] = [];
  const h = (k: string, v: string) => v && head.push(fold(k, v));

  if (mail.date) {
    const d = new Date(mail.date);
    if (!Number.isNaN(d.getTime())) h('Date', d.toUTCString().replace('GMT', '+0000'));
  }
  if (mail.from) h('From', formatAddr(mail.from));
  if (mail.to.length) h('To', addrList(mail.to));
  if (mail.cc.length) h('Cc', addrList(mail.cc));
  if (mail.bcc.length) h('Bcc', addrList(mail.bcc));
  if (mail.replyTo.length) h('Reply-To', addrList(mail.replyTo));
  h('Subject', encodeWord(mail.subject));
  if (mail.messageId) h('Message-ID', mail.messageId.startsWith('<') ? mail.messageId : `<${mail.messageId}>`);
  for (const x of mail.headers) if (!SKIP.has(x.key.toLowerCase()) && x.value) head.push(fold(x.key, x.value));
  head.push('MIME-Version: 1.0');

  const inline = mail.attachments.filter((a) => a.contentId && (a.inline || mail.html?.includes(`cid:${a.contentId}`)));
  const files = mail.attachments.filter((a) => !inline.includes(a));

  // Build the body tree: mixed > alternative > related
  let body: { header: string; body: string };
  const htmlPart = mail.html ? textPart('text/html', mail.html) : undefined;
  const textOnly = textPart('text/plain', mail.text ?? '');
  let htmlNode: { header: string; body: string } | undefined;
  if (htmlPart) {
    if (inline.length) {
      const rel = multipart('related', [htmlPart, ...inline.map((a) => filePart(a, true))]);
      htmlNode = rel;
    } else {
      const [hd, ...rest] = htmlPart.split(CRLF + CRLF);
      htmlNode = { header: hd, body: rest.join(CRLF + CRLF) };
    }
  }
  const asPart = (n: { header: string; body: string }) => `${n.header}${CRLF}${CRLF}${n.body}`;

  if (htmlNode && mail.text) body = multipart('alternative', [textOnly, asPart(htmlNode)]);
  else if (htmlNode) body = htmlNode;
  else {
    const [hd, ...rest] = textOnly.split(CRLF + CRLF);
    body = { header: hd, body: rest.join(CRLF + CRLF) };
  }
  if (files.length) body = multipart('mixed', [asPart(body), ...files.map((a) => filePart(a, false))]);

  const text = head.join(CRLF) + CRLF + body.header + CRLF + CRLF + body.body + CRLF;
  return enc.encode(text);
}
