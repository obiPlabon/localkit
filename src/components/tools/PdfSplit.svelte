<script lang="ts">
  import { PDFDocument, degrees } from 'pdf-lib';
  import { downloadBlob, formatBytes } from '../../lib/tools/util';
  import { makeZip } from '../../lib/tools/zip';
  import { openPdf, renderPage } from '../../lib/pdf/pdfjs';
  import { parseRanges, formatRanges } from '../../lib/pdf/pages';

  type Action = 'extract' | 'delete' | 'rotate' | 'each' | 'every';

  let file = $state<File | null>(null);
  let bytes: Uint8Array | null = null;
  let pageCount = $state(0);
  let thumbs = $state<string[]>([]);
  let order = $state<number[]>([]); // selected pages, in the order they will be used
  let rangeText = $state('');
  let action = $state<Action>('extract');
  let every = $state(2);
  let angle = $state(90);
  let dragging = $state(false);
  let busy = $state(false);
  let err = $state('');
  let rangeErr = $state('');
  let token = 0;

  async function load(f: File | undefined) {
    if (!f) return;
    err = ''; rangeErr = '';
    const t = ++token;
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      const doc = await PDFDocument.load(data);
      bytes = data; file = f; pageCount = doc.getPageCount();
      order = []; rangeText = ''; thumbs = [];
      renderThumbs(data, t);
    } catch {
      err = 'Could not read this PDF. It may be password-protected or damaged.';
    }
  }

  async function renderThumbs(data: Uint8Array, t: number) {
    try {
      const doc = await openPdf(data);
      for (let p = 1; p <= doc.numPages; p++) {
        if (t !== token) return;
        const c = await renderPage(doc, p, 0.35);
        thumbs[p - 1] = c.toDataURL('image/jpeg', 0.7);
      }
    } catch (e) { console.error('thumbnail render failed', e); }
  }

  function onRangeInput() {
    try {
      order = parseRanges(rangeText, pageCount);
      rangeErr = '';
    } catch (e) {
      rangeErr = e instanceof Error ? e.message : 'Invalid range.';
    }
  }

  function toggle(i: number) {
    order = order.includes(i) ? order.filter((x) => x !== i) : [...order, i];
    rangeText = formatRanges(order);
    rangeErr = '';
  }

  const selectedSet = $derived(new Set(order));
  const needsSelection = $derived(action === 'extract' || action === 'delete');
  const stem = $derived(file?.name.replace(/\.pdf$/i, '') ?? 'document');

  const pdfBlob = (b: Uint8Array) => new Blob([b as BlobPart], { type: 'application/pdf' });

  async function subset(src: PDFDocument, idx: number[]) {
    const out = await PDFDocument.create();
    (await out.copyPages(src, idx)).forEach((p) => out.addPage(p));
    return out.save();
  }

  async function run() {
    if (!bytes) return;
    busy = true; err = '';
    try {
      const src = await PDFDocument.load(bytes);
      const all = src.getPageIndices();
      if (action === 'extract') {
        if (!order.length) throw new Error('Pick at least one page to extract.');
        downloadBlob(pdfBlob(await subset(src, order)), `${stem}-extract.pdf`);
      } else if (action === 'delete') {
        if (!order.length) throw new Error('Pick the pages to delete.');
        const keep = all.filter((i) => !selectedSet.has(i));
        if (!keep.length) throw new Error('That would delete every page.');
        downloadBlob(pdfBlob(await subset(src, keep)), `${stem}-edited.pdf`);
      } else if (action === 'rotate') {
        const targets = order.length ? order : all;
        for (const i of targets) {
          const page = src.getPage(i);
          page.setRotation(degrees((page.getRotation().angle + angle) % 360));
        }
        downloadBlob(pdfBlob(await src.save()), `${stem}-rotated.pdf`);
      } else {
        const size = action === 'each' ? 1 : Math.max(1, Math.floor(every) || 1);
        const entries = [];
        const width = String(Math.ceil(all.length / size)).length;
        for (let s = 0, n = 1; s < all.length; s += size, n++) {
          const data = await subset(src, all.slice(s, s + size));
          entries.push({ name: `${stem}-${String(n).padStart(width, '0')}.pdf`, data });
        }
        downloadBlob(makeZip(entries), `${stem}-split.zip`);
      }
    } catch (e) {
      err = e instanceof Error ? e.message : 'Something went wrong.';
    }
    busy = false;
  }

  const labels: Record<Action, string> = {
    extract: 'Extract / reorder', delete: 'Delete pages', rotate: 'Rotate', each: 'Split every page', every: 'Split every N pages',
  };
  const hints: Record<Action, string> = {
    extract: 'Click pages or type a range like 1-3, 5, 8-. The new PDF follows the order you give, so 3, 1, 2 reorders.',
    delete: 'Click the pages to remove, or type a range.',
    rotate: 'Click pages to rotate, or leave none selected to rotate the whole document.',
    each: 'Every page becomes its own PDF, bundled into one ZIP.',
    every: 'Pages are cut into equal parts, bundled into one ZIP.',
  };
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
      <small>🔒 Processed on your device. Nothing is uploaded.</small>
    </label>
  {:else}
    <div class="tk-row between">
      <span><strong>{file.name}</strong> <span class="muted">· {pageCount} {pageCount === 1 ? 'page' : 'pages'} · {formatBytes(file.size)}</span></span>
      <button class="opt" onclick={() => { file = null; bytes = null; token++; thumbs = []; order = []; rangeText = ''; }}>Change file</button>
    </div>

    <div class="tk-row">
      {#each Object.keys(labels) as a}
        <button class="opt" class:on={action === a} onclick={() => (action = a as Action)}>{labels[a as Action]}</button>
      {/each}
    </div>
    <p class="muted">{hints[action]}</p>

    {#if action === 'every'}
      <label class="check">Pages per file <input type="number" min="1" bind:value={every} style="width:5.5rem" /></label>
    {/if}
    {#if action === 'rotate'}
      <label class="check">Rotate by
        <select bind:value={angle}>
          <option value={90}>90° clockwise</option>
          <option value={180}>180°</option>
          <option value={270}>90° counter-clockwise</option>
        </select></label>
    {/if}

    {#if needsSelection || action === 'rotate'}
      <div>
        <label class="lbl" for="pg-range">Pages</label>
        <input id="pg-range" type="text" bind:value={rangeText} oninput={onRangeInput} placeholder="e.g. 1-3, 5, 8-" spellcheck="false" autocomplete="off" style="font-family:var(--font-mono)" />
        {#if rangeErr}<p class="err" role="alert" style="margin-top:.3rem">{rangeErr}</p>{/if}
      </div>
    {/if}

    {#if needsSelection || action === 'rotate'}
      <div class="grid">
        {#each Array(pageCount) as _, i}
          <button type="button" class="thumb" class:sel={selectedSet.has(i)} onclick={() => toggle(i)} aria-pressed={selectedSet.has(i)} aria-label={`Page ${i + 1}`}>
            {#if thumbs[i]}<img src={thumbs[i]} alt="" style={action === 'rotate' && selectedSet.has(i) ? `transform:rotate(${angle}deg)` : ''} />{:else}<span class="ph"></span>{/if}
            <span class="n">{i + 1}</span>
          </button>
        {/each}
      </div>
    {/if}

    <div class="tk-row">
      <button class="opt on" onclick={run} disabled={busy || !!rangeErr}>
        {busy ? 'Working…' : action === 'extract' ? `Extract ${order.length || ''} ${order.length === 1 ? 'page' : 'pages'}`.replace('  ', ' ') : action === 'delete' ? `Delete ${order.length} ${order.length === 1 ? 'page' : 'pages'}` : action === 'rotate' ? 'Rotate and save' : 'Split and save ZIP'}
      </button>
      {#if order.length && needsSelection}<button class="opt" onclick={() => { order = []; rangeText = ''; }}>Clear selection</button>{/if}
    </div>
  {/if}
  {#if err}<p class="err" role="alert">{err}</p>{/if}
</div>

<style>
  .grid { display: grid; gap: var(--s-3); grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr)); }
  .thumb { position: relative; display: grid; place-items: center; aspect-ratio: 3 / 4; padding: .35rem; cursor: pointer; background: var(--surface); border: 1px solid var(--border-strong); overflow: hidden; }
  .thumb:hover { background: var(--accent-soft); }
  .thumb.sel { border-color: var(--accent); box-shadow: inset 0 0 0 2px var(--accent); background: var(--accent-soft); }
  .thumb img { max-width: 100%; max-height: 100%; object-fit: contain; background: #fff; transition: transform .2s; }
  .ph { width: 70%; height: 80%; background: var(--surface-2); }
  .n { position: absolute; left: 0; bottom: 0; padding: .1rem .4rem; font: 400 var(--text-xs)/1.4 var(--font-mono); background: var(--surface); border: 1px solid var(--border-strong); border-width: 1px 1px 0 0; color: var(--muted); }
  .sel .n { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
</style>
