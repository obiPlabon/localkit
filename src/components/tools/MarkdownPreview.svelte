<script lang="ts">
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { copyText, downloadBlob } from '../../lib/tools/util';

  const sample = `# Hello, Markdown

Write on the left, see it on the right. Nothing leaves your browser.

## Features

- **Bold**, *italic* and \`inline code\`
- [Links](https://example.com)
- Task lists and tables

| Name | Role |
| ---- | ---- |
| Ada  | Admin |

- [x] Done
- [ ] To do

> A quote worth keeping.

\`\`\`js
console.log('hi');
\`\`\`
`;

  let src = $state(sample);
  let view = $state<'split' | 'preview' | 'html'>('split');
  let copied = $state('');

  const html = $derived(DOMPurify.sanitize(marked.parse(src, { async: false, gfm: true, breaks: false }) as string));

  async function copy(key: string, v: string) {
    if (await copyText(v)) {
      copied = key;
      setTimeout(() => (copied = ''), 1200);
    }
  }
  function save() {
    const doc = `<!doctype html><meta charset="utf-8"><title>Document</title><body>\n${html}\n</body>`;
    downloadBlob(new Blob([doc], { type: 'text/html' }), 'document.html');
  }
  async function onFile(f: File | undefined) {
    if (f) src = await f.text();
  }
</script>

<div class="tk">
  <div class="tk-row">
    <button class="opt" class:on={view === 'split'} onclick={() => (view = 'split')}>Split</button>
    <button class="opt" class:on={view === 'preview'} onclick={() => (view = 'preview')}>Preview</button>
    <button class="opt" class:on={view === 'html'} onclick={() => (view = 'html')}>HTML</button>
    <button class="opt" onclick={() => copy('md', src)}>{copied === 'md' ? 'Copied' : 'Copy Markdown'}</button>
    <button class="opt" onclick={() => copy('html', html)}>{copied === 'html' ? 'Copied' : 'Copy HTML'}</button>
    <button class="opt" onclick={save}>Save .html</button>
    <input type="file" accept=".md,.markdown,.txt,text/*" onchange={(e) => onFile(e.currentTarget.files?.[0])} />
  </div>
  <div class={view === 'split' ? 'tk-grid2' : ''}>
    {#if view !== 'preview' && view !== 'html'}
      <div>
        <label class="lbl" for="md-in">Markdown</label>
        <textarea id="md-in" bind:value={src} spellcheck="false" style="min-height:26rem"></textarea>
      </div>
    {/if}
    {#if view === 'html'}
      <textarea class="out" readonly value={html} spellcheck="false" style="min-height:26rem"></textarea>
    {:else}
      <div>
        <span class="lbl">Preview</span>
        <div class="md">{@html html}</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .md { border: 1px solid var(--border); padding: var(--s-4); min-height: 26rem; background: var(--surface); overflow-wrap: anywhere; }
  .md :global(h1), .md :global(h2), .md :global(h3) { margin: 1.1em 0 .4em; }
  .md :global(h1:first-child), .md :global(h2:first-child) { margin-top: 0; }
  .md :global(h1) { font-size: var(--text-2xl); }
  .md :global(h2) { font-size: var(--text-xl); }
  .md :global(p), .md :global(ul), .md :global(ol), .md :global(pre), .md :global(blockquote), .md :global(table) { margin: 0 0 .9em; }
  .md :global(ul), .md :global(ol) { padding-left: 1.4rem; }
  .md :global(code) { font: 400 .85em var(--font-mono); background: var(--surface-2); padding: .1em .35em; }
  .md :global(pre) { background: var(--surface-2); padding: var(--s-3); overflow: auto; border: 1px solid var(--border); }
  .md :global(pre code) { background: none; padding: 0; }
  .md :global(blockquote) { border-left: 3px solid var(--accent); padding-left: var(--s-3); color: var(--muted); }
  .md :global(table) { border-collapse: collapse; }
  .md :global(th), .md :global(td) { border: 1px solid var(--border-strong); padding: .35rem .7rem; text-align: left; }
  .md :global(img) { max-width: 100%; }
  .md :global(hr) { border: 0; border-top: 1px solid var(--border); }
</style>
