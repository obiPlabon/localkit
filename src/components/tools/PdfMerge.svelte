<script lang="ts">
  import { PDFDocument } from 'pdf-lib';
  import { downloadBlob, formatBytes } from '../../lib/tools/util';

  type Item = { id: number; file: File; pages: number; error?: string };

  let items = $state<Item[]>([]);
  let dragging = $state(false);
  let busy = $state(false);
  let err = $state('');
  let nextId = 0;

  async function add(list: FileList | null | undefined) {
    err = '';
    const pdfs = [...(list ?? [])].filter((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    for (const file of pdfs) {
      const it: Item = { id: nextId++, file, pages: 0 };
      try {
        const doc = await PDFDocument.load(await file.arrayBuffer());
        it.pages = doc.getPageCount();
      } catch {
        it.error = 'Could not read this PDF. It may be password-protected or damaged.';
      }
      items.push(it);
    }
  }

  function move(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
  }
  const remove = (i: number) => items.splice(i, 1);

  const valid = $derived(items.filter((i) => !i.error));
  const totalPages = $derived(valid.reduce((n, i) => n + i.pages, 0));

  async function merge() {
    busy = true; err = '';
    try {
      const out = await PDFDocument.create();
      for (const it of valid) {
        const src = await PDFDocument.load(await it.file.arrayBuffer());
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), 'merged.pdf');
    } catch (e) {
      err = e instanceof Error ? e.message : 'Could not merge these files.';
    }
    busy = false;
  }
</script>

<div class="tk">
  <label
    class="dropzone" class:dragging
    ondragover={(e) => { e.preventDefault(); dragging = true; }}
    ondragleave={() => (dragging = false)}
    ondrop={(e) => { e.preventDefault(); dragging = false; add(e.dataTransfer?.files); }}
  >
    <input type="file" accept="application/pdf,.pdf" multiple hidden onchange={(e) => { add(e.currentTarget.files); e.currentTarget.value = ''; }} />
    <strong>Drop PDF files here</strong>
    <span>or click to choose · add as many as you like</span>
    <small>🔒 Merged on your device. Nothing is uploaded.</small>
  </label>

  {#if items.length}
    <table class="kv">
      <tbody>
        {#each items as it, i (it.id)}
          <tr>
            <td style="width:1%;white-space:nowrap" class="muted">{i + 1}</td>
            <td>{it.file.name}
              {#if it.error}<div class="err">{it.error}</div>
              {:else}<div class="muted">{it.pages} {it.pages === 1 ? 'page' : 'pages'} · {formatBytes(it.file.size)}</div>{/if}</td>
            <td style="width:1%;white-space:nowrap">
              <button class="opt" onclick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button class="opt" onclick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
              <button class="opt" onclick={() => remove(i)} aria-label="Remove">✕</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <div class="tk-row">
      <button class="opt on" onclick={merge} disabled={busy || valid.length < 2}>{busy ? 'Merging…' : `Merge ${valid.length} files`}</button>
      <button class="opt" onclick={() => (items = [])}>Clear</button>
      <span class="muted">{totalPages} pages in total{valid.length < 2 ? ' · add at least two PDFs' : ''}</span>
    </div>
  {/if}
  {#if err}<p class="err" role="alert">{err}</p>{/if}
</div>
