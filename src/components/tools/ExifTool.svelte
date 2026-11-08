<script lang="ts">
  import exifr from 'exifr';
  import { downloadBlob, formatBytes } from '../../lib/tools/util';
  import { stripJpeg, stripPng } from '../../lib/tools/imgmeta';

  const OPTS = { tiff: true, ifd0: {}, exif: true, gps: true, xmp: true, iptc: true, jfif: true, icc: false, interop: false, mergeOutput: true, translateKeys: true, translateValues: true, reviveValues: true, sanitize: true, multiSegment: true } as const;

  let file = $state<File | null>(null);
  let url = $state('');
  let tags = $state<[string, string][]>([]);
  let gps = $state<{ latitude: number; longitude: number } | null>(null);
  let filter = $state('');
  let dragging = $state(false);
  let busy = $state(false);
  let err = $state('');
  let cleaned = $state<{ blob: Blob; name: string; removed: number; lossless: boolean } | null>(null);

  function show(v: unknown): string {
    if (v instanceof Date) return v.toLocaleString();
    if (v instanceof Uint8Array) return `${v.length} bytes`;
    if (Array.isArray(v)) return v.map(show).join(', ');
    if (v && typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  async function read(f: File | Blob): Promise<[string, string][]> {
    const data = await exifr.parse(f, OPTS as any).catch(() => undefined);
    if (!data) return [];
    return Object.entries(data)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, show(v)] as [string, string]);
  }

  async function load(f: File | undefined) {
    if (!f) return;
    err = ''; cleaned = null; filter = '';
    if (!f.type.startsWith('image/')) { err = 'Please choose an image file.'; return; }
    busy = true;
    if (url) URL.revokeObjectURL(url);
    file = f; url = URL.createObjectURL(f);
    try {
      tags = await read(f);
      gps = await exifr.gps(f).then((g: any) => (g && Number.isFinite(g.latitude) ? g : null)).catch(() => null);
    } catch {
      tags = []; gps = null;
    }
    busy = false;
  }

  async function strip() {
    if (!file) return;
    busy = true; err = ''; cleaned = null;
    try {
      const src = new Uint8Array(await file.arrayBuffer());
      let out: Blob, lossless = true;
      if (file.type === 'image/jpeg') out = new Blob([stripJpeg(src) as BlobPart], { type: 'image/jpeg' });
      else if (file.type === 'image/png') out = new Blob([stripPng(src) as BlobPart], { type: 'image/png' });
      else {
        // Other formats: decode and re-encode, which drops all metadata (but is not lossless for WebP).
        lossless = false;
        const bmp = await createImageBitmap(file);
        const c = document.createElement('canvas');
        c.width = bmp.width; c.height = bmp.height;
        c.getContext('2d')!.drawImage(bmp, 0, 0);
        bmp.close();
        const mime = file.type === 'image/webp' ? 'image/webp' : 'image/png';
        const b = await new Promise<Blob | null>((r) => c.toBlob(r, mime, 0.95));
        if (!b) throw new Error('This browser cannot re-encode this format.');
        out = b;
      }
      const left = (await read(out)).length;
      const ext = out.type === 'image/jpeg' ? 'jpg' : out.type.split('/')[1];
      cleaned = { blob: out, name: file.name.replace(/\.[^.]+$/, '') + `-clean.${ext}`, removed: Math.max(0, tags.length - left), lossless };
    } catch (e) {
      err = e instanceof Error ? e.message : 'Could not clean this image.';
    }
    busy = false;
  }

  const shown = $derived(tags.filter(([k, v]) => !filter || (k + ' ' + v).toLowerCase().includes(filter.toLowerCase())));
</script>

<div class="tk">
  {#if !file}
    <label
      class="dropzone" class:dragging
      ondragover={(e) => { e.preventDefault(); dragging = true; }}
      ondragleave={() => (dragging = false)}
      ondrop={(e) => { e.preventDefault(); dragging = false; load(e.dataTransfer?.files[0]); }}
    >
      <input type="file" accept="image/*" hidden onchange={(e) => load(e.currentTarget.files?.[0])} />
      <strong>Drop a photo here</strong>
      <span>or click to choose · JPG, PNG, WebP, HEIC, TIFF</span>
      <small>🔒 Read on your device. Nothing is uploaded.</small>
    </label>
  {:else}
    <div class="tk-row between">
      <span><strong>{file.name}</strong> <span class="muted">· {formatBytes(file.size)}</span></span>
      <button class="opt" onclick={() => { file = null; tags = []; gps = null; cleaned = null; }}>Change file</button>
    </div>

    <div class="layout">
      <img src={url} alt="Preview" class="pv" />
      <div style="min-width:0">
        {#if gps}
          <p class="warn" role="status">⚠ This photo contains GPS coordinates: <span class="mono-out">{gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)}</span>. Anyone you share the file with can see where it was taken.</p>
        {/if}
        {#if tags.length}
          <input type="text" bind:value={filter} placeholder="Filter {tags.length} fields…" aria-label="Filter fields" style="margin-bottom:.6rem" />
          <div class="scroll">
            <table class="kv">
              <tbody>
                {#each shown as [k, v]}<tr><th>{k}</th><td class="mono-out">{v}</td></tr>{/each}
              </tbody>
            </table>
          </div>
        {:else if !busy}
          <p class="muted">No metadata found in this file.</p>
        {/if}
      </div>
    </div>

    {#if tags.length}
      <div class="tk-row">
        <button class="opt on" onclick={strip} disabled={busy}>{busy ? 'Working…' : 'Remove all metadata'}</button>
        {#if cleaned}
          <button class="opt" onclick={() => downloadBlob(cleaned!.blob, cleaned!.name)}>Save clean copy</button>
          <span class="ok">Removed {cleaned.removed} {cleaned.removed === 1 ? 'field' : 'fields'} · {formatBytes(file.size)} → {formatBytes(cleaned.blob.size)}{cleaned.lossless ? ' · pixels untouched' : ' · re-encoded'}</span>
        {/if}
      </div>
    {/if}
  {/if}
  {#if err}<p class="err" role="alert">{err}</p>{/if}
</div>

<style>
  .layout { display: grid; gap: var(--s-4); grid-template-columns: minmax(0, 14rem) minmax(0, 1fr); align-items: start; }
  @media (max-width: 700px) { .layout { grid-template-columns: 1fr; } }
  .pv { width: 100%; max-height: 18rem; object-fit: contain; border: 1px solid var(--border); background: var(--surface-2); }
  .scroll { max-height: 26rem; overflow: auto; border: 1px solid var(--border); padding: 0 var(--s-3); }
  .warn { margin: 0 0 var(--s-3); padding: var(--s-3); border: 1px solid var(--danger); color: var(--danger); font-size: var(--text-sm); }
</style>
