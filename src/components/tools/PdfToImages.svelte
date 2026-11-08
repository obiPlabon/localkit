<script lang="ts">
  import { downloadBlob, formatBytes } from '../../lib/tools/util';
  import { makeZip } from '../../lib/tools/zip';
  import { openPdf, renderPage } from '../../lib/pdf/pdfjs';
  import { parseRanges } from '../../lib/pdf/pages';

  type Out = { page: number; blob: Blob; url: string; w: number; h: number };

  let file = $state<File | null>(null);
  let data: Uint8Array | null = null;
  let pageCount = $state(0);
  let fmt = $state<'png' | 'jpeg' | 'webp'>('png');
  let dpi = $state(150);
  let quality = $state(90);
  let rangeText = $state('');
  let outs = $state<Out[]>([]);
  let dragging = $state(false);
  let busy = $state(false);
  let progress = $state('');
  let err = $state('');
  let run = 0;

  const mime = $derived({ png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }[fmt]);
  const ext = $derived(fmt === 'jpeg' ? 'jpg' : fmt);
  const stem = $derived(file?.name.replace(/\.pdf$/i, '') ?? 'page');

  function clearOuts() { outs.forEach((o) => URL.revokeObjectURL(o.url)); outs = []; }

  async function load(f: File | undefined) {
    if (!f) return;
    err = ''; clearOuts();
    try {
      const d = new Uint8Array(await f.arrayBuffer());
      const doc = await openPdf(d);
      data = d; file = f; pageCount = doc.numPages; rangeText = '';
      await convert();
    } catch {
      err = 'Could not read this PDF. It may be password-protected or damaged.';
    }
  }

  async function convert() {
    if (!data) return;
    const id = ++run;
    busy = true; err = ''; clearOuts();
    try {
      const pages = rangeText.trim() ? parseRanges(rangeText, pageCount) : Array.from({ length: pageCount }, (_, i) => i);
      if (!pages.length) throw new Error('No pages selected.');
      const doc = await openPdf(data);
      const result: Out[] = [];
      for (let k = 0; k < pages.length; k++) {
        if (id !== run) return;
        progress = `Rendering page ${pages[k] + 1} (${k + 1} of ${pages.length})…`;
        const canvas = await renderPage(doc, pages[k] + 1, dpi / 72);
        if (fmt === 'jpeg') {
          // JPEG has no alpha: flatten onto white
          const flat = document.createElement('canvas');
          flat.width = canvas.width; flat.height = canvas.height;
          const ctx = flat.getContext('2d')!;
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, flat.width, flat.height); ctx.drawImage(canvas, 0, 0);
          canvas.width = 0;
          const blob = await new Promise<Blob | null>((r) => flat.toBlob(r, mime, quality / 100));
          if (!blob) throw new Error('Could not encode this page.');
          result.push({ page: pages[k] + 1, blob, url: URL.createObjectURL(blob), w: flat.width, h: flat.height });
        } else {
          const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, mime, quality / 100));
          if (!blob) throw new Error('Could not encode this page.');
          result.push({ page: pages[k] + 1, blob, url: URL.createObjectURL(blob), w: canvas.width, h: canvas.height });
        }
      }
      if (id === run) outs = result;
    } catch (e) {
      if (id === run) err = e instanceof Error ? e.message : 'Something went wrong.';
    }
    if (id === run) { busy = false; progress = ''; }
  }

  const name = (o: Out) => `${stem}-${String(o.page).padStart(String(pageCount).length, '0')}.${ext}`;

  async function saveZip() {
    const entries = await Promise.all(outs.map(async (o) => ({ name: name(o), data: new Uint8Array(await o.blob.arrayBuffer()) })));
    downloadBlob(makeZip(entries), `${stem}-images.zip`);
  }
</script>

<div class="tk">
  {#if !file}
    <label
      class="dropzone" class:dragging
      ondragover={(e) => { e.preventDefault(); dragging = true; }}
      ondragleave={() => (dragging = false)}
      ondrop={(e) => { e.preventDefault(); dragging = false; load(e.dataTransfer?.files[0]); }}
    >
      <input type="file" accept="application/pdf,.pdf" hidden onchange={(e) => load(e.currentTarget.files?.[0])} />
      <strong>Drop a PDF here</strong>
      <span>or click to choose</span>
      <small>🔒 Rendered on your device. Nothing is uploaded.</small>
    </label>
  {:else}
    <div class="tk-row between">
      <span><strong>{file.name}</strong> <span class="muted">· {pageCount} {pageCount === 1 ? 'page' : 'pages'} · {formatBytes(file.size)}</span></span>
      <button class="opt" onclick={() => { run++; file = null; data = null; clearOuts(); busy = false; progress = ''; }}>Change file</button>
    </div>

    <div class="tk-row">
      <label class="check">Format
        <select bind:value={fmt} onchange={convert}>
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
          <option value="webp">WebP</option>
        </select></label>
      <label class="check">Resolution
        <select bind:value={dpi} onchange={convert}>
          <option value={72}>72 dpi (screen)</option>
          <option value={150}>150 dpi</option>
          <option value={300}>300 dpi (print)</option>
        </select></label>
      {#if fmt !== 'png'}
        <label class="check">Quality {quality}
          <input type="range" min="30" max="100" bind:value={quality} onchange={convert} /></label>
      {/if}
      <label class="check">Pages
        <input type="text" bind:value={rangeText} onchange={convert} placeholder="all, or 1-3, 5" spellcheck="false" style="width:10rem;font-family:var(--font-mono)" /></label>
    </div>

    {#if busy}<p class="muted">{progress || 'Working…'}</p>{/if}

    {#if outs.length}
      <div class="grid">
        {#each outs as o}
          <figure>
            <img src={o.url} alt={`Page ${o.page}`} />
            <figcaption>
              <span class="muted">p.{o.page} · {o.w}×{o.h} · {formatBytes(o.blob.size)}</span>
              <button class="opt" onclick={() => downloadBlob(o.blob, name(o))}>Save</button>
            </figcaption>
          </figure>
        {/each}
      </div>
      {#if outs.length > 1}<div><button class="opt on" onclick={saveZip}>Save all as ZIP</button></div>{/if}
    {/if}
  {/if}
  {#if err}<p class="err" role="alert">{err}</p>{/if}
</div>

<style>
  .grid { display: grid; gap: var(--s-3); grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); }
  figure { margin: 0; border: 1px solid var(--border); background: var(--surface-2); display: grid; gap: .4rem; padding: .5rem; align-content: start; }
  figure img { width: 100%; height: auto; background: #fff; border: 1px solid var(--border); }
  figcaption { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; justify-content: space-between; font-size: var(--text-xs); }
</style>
