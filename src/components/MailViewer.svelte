<script lang="ts">
  import { parseMailFile } from '../lib/mail/client';
  import { renderBody, formatAddress, formatSize } from '../lib/mail/render';
  import type { ParsedMail } from '../lib/mail/types';

  let { accept = '.eml', label = 'EML' }: { accept?: string; label?: string } = $props();

  type Tab = 'message' | 'headers' | 'source' | 'attachments';

  let mail = $state<ParsedMail | null>(null);
  let fileName = $state('');
  let error = $state('');
  let loading = $state(false);
  let dragging = $state(false);
  let tab = $state<Tab>('message');
  let allowRemote = $state(false);

  const rendered = $derived(mail ? renderBody(mail, allowRemote) : null);
  const downloadable = $derived(mail?.attachments.filter((a) => !(a.inline && a.contentId)) ?? []);
  const replyToMismatch = $derived(
    !!mail?.from &&
      mail.replyTo.length > 0 &&
      !mail.replyTo.some((r) => r.address.toLowerCase() === mail!.from!.address.toLowerCase()),
  );

  async function open(file: File | undefined) {
    if (!file) return;
    error = '';
    loading = true;
    try {
      mail = await parseMailFile(file);
      fileName = file.name;
      tab = 'message';
      allowRemote = false;
    } catch (e) {
      mail = null;
      error = e instanceof Error ? e.message : 'Could not read this file.';
    } finally {
      loading = false;
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    open(e.dataTransfer?.files[0]);
  }

  function download(a: ParsedMail['attachments'][number]) {
    const url = URL.createObjectURL(new Blob([a.data], { type: a.mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = a.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'message', label: 'Message' },
    { id: 'headers', label: 'Headers' },
    { id: 'source', label: 'Plain text' },
    { id: 'attachments', label: 'Attachments' },
  ];
</script>

{#if !mail}
  <label
    class="drop"
    class:dragging
    ondragover={(e) => { e.preventDefault(); dragging = true; }}
    ondragleave={() => (dragging = false)}
    ondrop={onDrop}
  >
    <input type="file" {accept} onchange={(e) => open(e.currentTarget.files?.[0])} hidden />
    <strong>{loading ? 'Reading…' : `Drop a ${label} file here`}</strong>
    <span>or click to choose one</span>
    <small>🔒 Parsed in your browser. Your file is never uploaded.</small>
  </label>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
{:else}
  <div class="bar">
    <span class="file">{fileName}</span>
    <button onclick={() => { mail = null; }}>Open another</button>
  </div>

  <header class="summary">
    <h2>{mail.subject || '(no subject)'}</h2>
    <dl>
      <dt>From</dt><dd>{formatAddress(mail.from)}</dd>
      {#if mail.to.length}<dt>To</dt><dd>{mail.to.map(formatAddress).join(', ')}</dd>{/if}
      {#if mail.cc.length}<dt>Cc</dt><dd>{mail.cc.map(formatAddress).join(', ')}</dd>{/if}
      {#if mail.date}<dt>Date</dt><dd>{new Date(mail.date).toLocaleString()}</dd>{/if}
    </dl>
    {#if replyToMismatch}
      <p class="warn">
        ⚠️ Reply-To ({mail.replyTo.map(formatAddress).join(', ')}) differs from the sender. Be careful if this looks suspicious.
      </p>
    {/if}
  </header>

  <nav class="tabs" role="tablist">
    {#each tabs as t}
      <button role="tab" aria-selected={tab === t.id} class:active={tab === t.id} onclick={() => (tab = t.id)}>
        {t.label}{#if t.id === 'attachments' && downloadable.length} ({downloadable.length}){/if}
      </button>
    {/each}
  </nav>

  {#if tab === 'message' && rendered}
    {#if rendered.remoteCount > 0 && !allowRemote}
      <p class="notice">
        {rendered.remoteCount} remote image{rendered.remoteCount > 1 ? 's' : ''} blocked (may track you).
        <button onclick={() => (allowRemote = true)}>Load images</button>
      </p>
    {/if}
    <iframe title="Email body" sandbox="allow-popups allow-popups-to-escape-sandbox" srcdoc={rendered.srcdoc}></iframe>
  {:else if tab === 'headers'}
    <table class="headers">
      <tbody>
        {#each mail.headers as h}
          <tr><th>{h.key}</th><td>{h.value}</td></tr>
        {/each}
      </tbody>
    </table>
  {:else if tab === 'source'}
    <pre class="text">{mail.text ?? '(no plain-text part)'}</pre>
  {:else if tab === 'attachments'}
    {#if downloadable.length === 0}
      <p class="muted">No attachments.</p>
    {:else}
      <ul class="files">
        {#each downloadable as a}
          <li>
            <span>{a.filename} <small>{a.mimeType} · {formatSize(a.size)}</small></span>
            <button onclick={() => download(a)}>Download</button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
{/if}

<style>
  .drop { display:flex; flex-direction:column; align-items:center; gap:.4rem; padding:4rem 1rem; background:var(--bg); border:2px dashed var(--border); border-radius:var(--r-lg); cursor:pointer; text-align:center; transition:background .15s,border-color .15s; }
  .drop:hover, .drop.dragging { background:var(--accent-soft); border-color:var(--accent); }
  .drop strong { font-size:1.15rem; }
  .drop span, .drop small, .muted { color:var(--muted); }
  .error { color:var(--danger); margin-top:1rem; }
  .bar { display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1rem; }
  .file { color:var(--muted); font-size:.9rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  button { font:inherit; padding:.35rem .8rem; border:1px solid var(--border); border-radius:8px; background:var(--surface); color:inherit; cursor:pointer; }
  button:hover { border-color:var(--accent); }
  .summary h2 { margin:0 0 .5rem; font-size:1.3rem; }
  dl { display:grid; grid-template-columns:auto 1fr; gap:.15rem .9rem; margin:0; font-size:.92rem; }
  dt { color:var(--muted); } dd { margin:0; overflow-wrap:anywhere; }
  .warn, .notice { padding:.55rem .8rem; border-radius:8px; font-size:.9rem; margin:.8rem 0 0; }
  .warn { background:var(--warn-bg); color:var(--warn-text); }
  .notice { background:var(--accent-soft); display:flex; gap:.8rem; align-items:center; flex-wrap:wrap; }
  .tabs { display:flex; gap:.25rem; margin:1.2rem 0 .8rem; border-bottom:1px solid var(--border); }
  .tabs button { border:0; border-bottom:2px solid transparent; border-radius:0; background:none; }
  .tabs button.active { border-bottom-color:var(--accent); font-weight:600; }
  iframe { width:100%; height:65vh; border:1px solid var(--border); border-radius:10px; background:#fff; }
  .headers { width:100%; border-collapse:collapse; font:12.5px/1.45 ui-monospace,monospace; }
  .headers th { text-align:left; vertical-align:top; padding:.3rem .8rem .3rem 0; white-space:nowrap; color:var(--muted); }
  .headers td { padding:.3rem 0; overflow-wrap:anywhere; border-bottom:1px solid var(--border); }
  .text { white-space:pre-wrap; font:13px/1.5 ui-monospace,monospace; overflow-wrap:anywhere; }
  .files { list-style:none; padding:0; margin:0; display:grid; gap:.5rem; }
  .files li { display:flex; justify-content:space-between; align-items:center; gap:1rem; padding:.6rem .8rem; border:1px solid var(--border); border-radius:8px; }
  .files small { color:var(--muted); margin-left:.4rem; }
</style>
