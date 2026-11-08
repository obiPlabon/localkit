<script lang="ts">
  import { PDFDocument } from 'pdf-lib';
  import { downloadBlob, formatBytes } from '../../lib/tools/util';

  type Item = { id: number; file: File; url: string };

  const SIZES: Record<string, [number, number] | null> = { a4: [595.28, 841.89], letter: [612, 792], fit: null };

  let items = $state<Item[]>([]);
  let pageSize = $state<'a4' | 'letter' | 'fit'>('a4');
  let orient = $state<'auto' | 'portrait' | 'landscape'>('auto');
  let margin = $state(24);
  let quality = $state(0.85);
  let dragging = $state(false);
  let busy = $state(false);
  let err = $state('');
  let nextId = 0;

  function add(list: FileList | null | undefined) {
    for (const f of [...(list ?? [])].filter((f) => f.type.startsWith('image/'))) {
      items.push({ id: nextId++, file: f, url: URL.createObjectURL(f) });
    }
  }
  function move(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
  }
  function remove(i: number) {
    URL.revokeObjectURL(items[i].url);
    items.splice(i, 1);
  }

  /** Decode (which applies EXIF rotation) and re-encode, so every format and phone photo embeds upright. */
  async function toEmbeddable(f: File) {
    const bmp = await createImageBitmap(f);
    const c = document.createElement('canvas');
    c.width = bmp.width; c.height = bmp.height;
    const ctx = c.getContext('2d')!;
    const png = f.type === 'image/png';
    if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(bmp, 0, 0);
    const w = bmp.width, h = bmp.height;
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, png ? 'image/png' : 'image/jpeg', quality));
    if (!blob) throw new Error(`Could not read ${f.name}.`);
    return { bytes: new Uint8Array(await blob.arrayBuffer()), png, w, h };
  }

  async function build() {
    busy = true; err = '';
    try {
      const pdf = await PDFDocument.create();
      for (const it of items) {
        const img = await toEmbeddable(it.file);
        const embedded = img.png ? await pdf.embedPng(img.bytes) : await pdf.embedJpg(img.bytes);
        let pw: number, ph: number, m = margin;
        const base = SIZES[pageSize];
        if (!base) { pw = img.w; ph = img.h; m = 0; }
        else {
          const landscape = orient === 'auto' ? img.w > img.h : orient === 'landscape';
          [pw, ph] = landscape ? [base[1], base[0]] : base;
        }
        const page = pdf.addPage([pw, ph]);
        const s = Math.min((pw - 2 * m) / img.w, (ph - 2 * m) / img.h);
        const dw = img.w * s, dh = img.h * s;
        page.drawImage(embedded, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
      }
      const bytes = await pdf.save();
      downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), 'images.pdf');
    } catch (e) {
      err = e instanceof Error ? e.message : 'Could not build the PDF.';
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
    <input type="file" accept="image/*" multiple hidden onchange={(e) => { add(e.currentTarget.files); e.currentTarget.value = ''; }} />
    <strong>Drop images here</strong>
    <span>or click to choose · JPG, PNG, WebP, GIF, BMP</span>
    <small>🔒 Converted on your device. Nothing is uploaded.</small>
  </label>

  <div class="tk-row">
    <label class="check">Page
      <select bind:value={pageSize}>
        <option value="a4">A4</option>
        <option value="letter">US Letter</option>
        <option value="fit">Fit to image</option>
      </select></label>
    {#if pageSize !== 'fit'}
      <label class="check">Orientation
        <select bind:value={orient}>
          <option value="auto">Auto</option>
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select></label>
      <label class="check">Margin <input type="number" min="0" max="200" bind:value={margin} style="width:5rem" /> pt</label>
    {/if}
    <label class="check">Image quality
      <select bind:value={quality}>
        <option value={0.95}>High</option>
        <option value={0.85}>Balanced</option>
        <option value={0.65}>Small file</option>
      </select></label>
  </div>

  {#if items.length}
    <table class="kv">
      <tbody>
        {#each items as it, i (it.id)}
          <tr>
            <td style="width:64px"><img src={it.url} alt="" style="width:56px;height:56px;object-fit:cover;border:1px solid var(--border)" /></td>
            <td>{it.file.name}<div class="muted">{formatBytes(it.file.size)} · page {i + 1}</div></td>
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
      <button class="opt on" onclick={build} disabled={busy}>{busy ? 'Building…' : `Create PDF (${items.length} ${items.length === 1 ? 'page' : 'pages'})`}</button>
      <button class="opt" onclick={() => { items.forEach((i) => URL.revokeObjectURL(i.url)); items = []; }}>Clear</button>
    </div>
  {/if}
  {#if err}<p class="err" role="alert">{err}</p>{/if}
</div>
