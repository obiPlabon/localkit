<script lang="ts">
  import { analyze, parseHeaderBlock, formatDelay, type Analysis, type Verdict } from '../../lib/mail/headers';
  import { parseMailFile } from '../../lib/mail/client';
  import type { MailHeader } from '../../lib/mail/types';

  const EXAMPLE = `Received: from mail-out.example.net (mail-out.example.net [203.0.113.25])
 by mx.google.com with ESMTPS id a1si123456qkb.7.2026.03.04.02.00.03
 for <you@example.com>; Wed, 04 Mar 2026 02:00:04 -0800 (PST)
Received: from app01.example.net (unknown [10.2.0.14])
 by mail-out.example.net (Postfix) with ESMTP id 4F2D31A8
 for <you@example.com>; Wed, 04 Mar 2026 10:00:01 +0000 (UTC)
Authentication-Results: mx.google.com;
 dkim=pass header.i=@example.net header.s=s1;
 spf=pass (google.com: domain of bounce@example.net designates 203.0.113.25 as permitted sender) smtp.mailfrom=bounce@example.net;
 dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=example.net
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.net; s=s1; h=from:to:subject:date; bh=abc; b=xyz
From: Example Team <hello@example.net>
To: You <you@example.com>
Subject: Your March report
Date: Wed, 04 Mar 2026 10:00:00 +0000
Message-ID: <20260304100000.4F2D31A8@example.net>
Return-Path: <bounce@example.net>`;

  let raw = $state('');
  let result = $state<Analysis | null>(null);
  let allHeaders = $state<MailHeader[]>([]);
  let error = $state('');
  let dragging = $state(false);
  let showAll = $state(false);

  function run(headers: MailHeader[]) {
    if (!headers.length) { result = null; allHeaders = []; error = raw.trim() ? 'No headers found. Paste the raw header block, which has lines like “From: …” and “Received: …”.' : ''; return; }
    error = '';
    allHeaders = headers;
    result = analyze(headers);
  }
  $effect(() => { run(parseHeaderBlock(raw)); });

  async function onFile(f: File | undefined) {
    if (!f) return;
    error = '';
    try {
      if (/\.msg$/i.test(f.name)) {
        const mail = await parseMailFile(f);
        if (!mail.headers.length) { error = 'This .msg has no transport headers (it may be a draft or an internal message).'; return; }
        raw = mail.headers.map((h) => `${h.key}: ${h.value}`).join('\n');
      } else raw = await f.text();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Could not read this file.';
    }
  }

  const label: Record<Verdict, string> = { pass: 'Pass', fail: 'Fail', softfail: 'Soft fail', neutral: 'Neutral', none: 'None', temperror: 'Temp error', permerror: 'Perm error', policy: 'Policy', unknown: 'Unknown' };
  const tone = (v: Verdict) => (v === 'pass' ? 'ok' : v === 'fail' || v === 'permerror' ? 'bad' : 'warn');
  const best = (method: string) => {
    const rs = result?.auth.filter((a) => a.method === method) ?? [];
    return rs.find((r) => r.result === 'pass') ?? rs[0];
  };
  const when = (d?: Date) => d?.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' }) ?? '';
</script>

<div class="tk">
  <div>
    <div class="tk-row between">
      <label class="lbl" for="eh-in">Raw email headers</label>
      <span class="tk-row">
        <button class="opt" onclick={() => (raw = EXAMPLE)}>Example</button>
        {#if raw}<button class="opt" onclick={() => { raw = ''; }}>Clear</button>{/if}
        <label class="opt" style="cursor:pointer">Open file<input type="file" accept=".eml,.msg,.txt,message/rfc822" hidden onchange={(e) => onFile(e.currentTarget.files?.[0])} /></label>
      </span>
    </div>
    <textarea
      id="eh-in" bind:value={raw} spellcheck="false" class:dragging
      placeholder="Paste headers here, or drop an .eml / .msg file.&#10;In Gmail: ⋮ → Show original. In Outlook: File → Properties → Internet headers."
      style="min-height:11rem"
      ondragover={(e) => { e.preventDefault(); dragging = true; }}
      ondragleave={() => (dragging = false)}
      ondrop={(e) => { e.preventDefault(); dragging = false; onFile(e.dataTransfer?.files[0]); }}
    ></textarea>
  </div>
  {#if error}<p class="err" role="alert">{error}</p>{/if}

  {#if result}
    <div class="auth">
      {#each ['spf', 'dkim', 'dmarc'] as m}
        {@const r = best(m)}
        <div class="pill {r ? tone(r.result) : 'none'}">
          <span>{m.toUpperCase()}</span>
          <b>{r ? label[r.result] : 'Not found'}</b>
        </div>
      {/each}
    </div>

    {#if result.flags.length}
      <ul class="flags">
        {#each result.flags as f}<li class={f.level}><span>{f.level === 'bad' ? 'Problem' : f.level === 'warn' ? 'Check' : 'Note'}</span> {f.text}</li>{/each}
      </ul>
    {/if}

    {#if result.summary.length}
      <div>
        <span class="lbl">Message</span>
        <table class="kv"><tbody>{#each result.summary as s}<tr><th>{s.label}</th><td class="mono-out">{s.value}</td></tr>{/each}</tbody></table>
      </div>
    {/if}

    <div>
      <span class="lbl">Delivery path{result.totalMs !== undefined ? ` · ${formatDelay(result.totalMs)} in transit` : ''}</span>
      {#if result.hops.length}
        <ol class="hops">
          {#each result.hops as h}
            <li>
              <div class="idx">{h.index}</div>
              <div class="body">
                <div><strong>{h.from || 'unknown'}</strong> <span class="muted">→</span> <strong>{h.by || 'unknown'}</strong></div>
                <div class="muted">{[h.protocol, h.ips.join(', '), h.date ? when(h.date) : h.rawDate].filter(Boolean).join(' · ')}</div>
              </div>
              <div class="delay" class:slow={(h.delay ?? 0) > 60_000} class:neg={(h.delay ?? 0) < -1000}>
                {#if h.delay !== undefined}{h.delay >= 0 ? '+' : ''}{formatDelay(h.delay)}{:else}—{/if}
              </div>
            </li>
          {/each}
        </ol>
      {:else}
        <p class="muted">No Received headers.</p>
      {/if}
    </div>

    {#if result.auth.length || result.dkimSignatures.length}
      <div>
        <span class="lbl">Authentication details</span>
        <table class="kv"><tbody>
          {#each result.auth as a}
            <tr><th>{a.method.toUpperCase()}</th><td><span class="v {tone(a.result)}">{label[a.result]}</span> <span class="muted">{a.detail}</span></td></tr>
          {/each}
          {#each result.dkimSignatures as s}
            <tr><th>DKIM key</th><td class="mono-out">d={s.domain} s={s.selector} {s.algorithm}</td></tr>
          {/each}
        </tbody></table>
      </div>
    {/if}

    <div>
      <button class="opt" onclick={() => (showAll = !showAll)}>{showAll ? 'Hide' : 'Show'} all {allHeaders.length} headers</button>
      {#if showAll}
        <table class="kv" style="margin-top:.6rem"><tbody>{#each allHeaders as h}<tr><th>{h.key}</th><td class="mono-out">{h.value}</td></tr>{/each}</tbody></table>
      {/if}
    </div>
    <p class="muted">SPF, DKIM and DMARC verdicts are copied from headers your mail provider added. This tool does not re-check them, and headers can be forged below the first trusted server.</p>
  {/if}
</div>

<style>
  textarea.dragging { border-color: var(--accent); background: var(--accent-soft); }
  .auth { display: grid; gap: var(--s-3); grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pill { border: 1px solid var(--border-strong); padding: var(--s-3); display: grid; gap: .2rem; background: var(--surface-2); }
  .pill span { font: 400 var(--text-xs)/1.3 var(--font-mono); letter-spacing: .08em; color: var(--muted); }
  .pill b { font: 450 1.3rem/1.1 var(--font-display); }
  .pill.ok { border-color: var(--accent); } .pill.ok b { color: var(--accent); }
  .pill.bad { border-color: var(--danger); background: color-mix(in srgb, var(--danger) 8%, transparent); } .pill.bad b { color: var(--danger); }
  .pill.warn { border-color: var(--warn-text); background: var(--warn-bg); } .pill.warn b { color: var(--warn-text); }
  .pill.none b { color: var(--muted); }
  .v.ok { color: var(--accent); font-weight: 500; } .v.bad { color: var(--danger); font-weight: 500; } .v.warn { color: var(--warn-text); font-weight: 500; }
  .flags { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s-2); }
  .flags li { padding: var(--s-3); border: 1px solid var(--border); font-size: var(--text-sm); }
  .flags li span { font: 400 var(--text-xs)/1 var(--font-mono); text-transform: uppercase; letter-spacing: .08em; margin-right: .5rem; }
  .flags li.bad { border-color: var(--danger); } .flags li.bad span { color: var(--danger); }
  .flags li.warn { background: var(--warn-bg); color: var(--warn-text); border-color: color-mix(in srgb, var(--warn-text) 35%, transparent); }
  .hops { list-style: none; margin: .4rem 0 0; padding: 0; display: grid; gap: 0; }
  .hops li { display: grid; grid-template-columns: 2rem minmax(0, 1fr) auto; gap: var(--s-3); padding: var(--s-3) 0; border-top: 1px solid var(--border); align-items: start; }
  .hops li:last-child { border-bottom: 1px solid var(--border); }
  .idx { width: 1.8rem; height: 1.8rem; display: grid; place-items: center; border: 1px solid var(--accent); color: var(--accent); font: 400 var(--text-xs)/1 var(--font-mono); }
  .body { min-width: 0; overflow-wrap: anywhere; font-size: var(--text-sm); }
  .delay { font: 400 var(--text-xs)/1.6 var(--font-mono); color: var(--muted); white-space: nowrap; }
  .delay.slow { color: var(--warn-text); background: var(--warn-bg); padding: 0 .4rem; }
  .delay.neg { color: var(--danger); }
  @media (max-width: 560px) { .auth { grid-template-columns: 1fr; } }
</style>
