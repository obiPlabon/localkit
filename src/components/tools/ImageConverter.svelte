<script lang="ts">
  import { downloadBlob, formatBytes } from '../../lib/tools/util';
  import { makeZip, uniqueName } from '../../lib/tools/zip';
  import { compress } from '../../lib/image/client';
  import { engines, formatInfo, type EngineId, type Format } from '../../lib/image/engines';

  type Item = { name: string; before: number; blob?: Blob; url?: string; w: number; h: number; error?: string };
  type Mode = 'original' | 'width' | 'height' | 'fit' | 'percent';

  let items = $state<Item[]>([]);
  let engine = $state<EngineId>('wasm');
  let format = $state<Format>('png');
  let quality = $state(85);
  let mode = $state<Mode>('original');
  let width = $state(1200);
  let height = $state(800);
  let percent = $state(50);
  let shrinkOnly = $state(true);
  let files: File[] = [];
  let dragging = $state(false);
  let busy = $state(false);
  let run = 0;

  const eng = $derived(engines.find((e) => e.id === engine)!);
  const info = $derived(formatInfo[format]);

  function setEngine(id: EngineId) {
    engine = id;
    const e = engines.find((x) => x.id === id)!;
    if (!e.formats.includes(format)) format = e.formats[0];
    reprocess();
  }

  function size(w: number, h: number) {
    let s = 1;
    if (mode === 'width' && width > 0) s = width / w;
    else if (mode === 'height' && height > 0) s = height / h;
    else if (mode === 'fit' && width > 0 && height > 0) s = Math.min(width / w, height / h);
    else if (mode === 'percent' && percent > 0) s = percent / 100;
    if (shrinkOnly && mode !== 'percent' && s > 1) s = 1;
    return { width: w * s, height: h * s };
  }

  async function process() {
    const id = ++run;
    busy = true;
    const out: Item[] = [];
    for (const f of files) {
      const it: Item = { name: f.name, before: f.size, w: 0, h: 0 };
      try {
        const r = await compress(f, { engine, format, quality, maxWidth: 0, size });
        it.blob = r.blob; it.w = r.width; it.h = r.height;
        it.url = URL.createObjectURL(r.blob);
      } catch (e) {
        it.error = e instanceof Error ? e.message : 'Could not read this image.';
      }
      out.push(it);
      if (id !== run) break;
    }
    if (id !== run) { out.forEach((o) => o.url && URL.revokeObjectURL(o.url)); return; }
    items.forEach((o) => o.url && URL.revokeObjectURL(o.url));
    items = out;
    busy = false;
  }

  function add(list: FileList | null | undefined) {
    const imgs = [...(list ?? [])].filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    files = imgs;
    process();
  }

  let timer: ReturnType<typeof setTimeout>;
  function reprocess() {
    if (!files.length) return;
    clearTimeout(timer);
    timer = setTimeout(process, 350);
  }

  const outName = (n: string) => n.replace(/\.[^.]+$/, '') + `.${info.ext}`;

  async function saveZip() {
    const seen = new Set<string>();
    const entries = await Promise.all(items.filter((i) => i.blob).map(async (i) => ({
      name: uniqueName(outName(i.name), seen), data: new Uint8Array(await i.blob!.arrayBuffer()),
    })));
    downloadBlob(makeZip(entries), 'images.zip');
  }
</script>

<div class="tk">
  <label
    class="dropzone" class:dragging
    ondragover={(e) => { e.preventDefault(); dragging = true; }}
    ondragleave={() => (dragging = false)}
    ondrop={(e) => { e.preventDefault(); dragging = false; add(e.dataTransfer?.files); }}
  >
    <input type="file" accept="image/*" multiple hidden onchange={(e) => add(e.currentTarget.files)} />
    <strong>{busy ? 'Converting…' : 'Drop images here'}</strong>
    <span>or click to choose · JPG, PNG, WebP, GIF, BMP, AVIF</span>
    <small>🔒 Converted on your device. Nothing is uploaded.</small>
  </label>

  <div>
    <span class="lbl">Engine</span>
    <div class="tk-row">
      {#each engines as e}
        <button class="opt" class:on={engine === e.id} onclick={() => setEngine(e.id)}>{e.label}</button>
      {/each}
    </div>
    <p class="muted" style="margin-top:.4rem">{eng.note}</p>
  </div>

  <div class="tk-row">
    <label class="check">Convert to
      <select bind:value={format} onchange={reprocess}>
        {#each eng.formats as f}<option value={f}>{formatInfo[f].label}</option>{/each}
      </select></label>
    <label class="check" class:muted={!info.lossy}>Quality {info.lossy ? quality : '(lossless)'}
      <input type="range" min="10" max="100" bind:value={quality} oninput={reprocess} disabled={!info.lossy} /></label>
  </div>

  <div class="tk-row">
    <label class="check">Resize
      <select bind:value={mode} onchange={reprocess}>
        <option value="original">Keep size</option>
        <option value="width">By width</option>
        <option value="height">By height</option>
        <option value="fit">Fit inside box</option>
        <option value="percent">By percent</option>
      </select></label>
    {#if mode === 'width' || mode === 'fit'}
      <label class="check">W <input type="number" min="1" bind:value={width} oninput={reprocess} style="width:6rem" /> px</label>
    {/if}
    {#if mode === 'height' || mode === 'fit'}
      <label class="check">H <input type="number" min="1" bind:value={height} oninput={reprocess} style="width:6rem" /> px</label>
    {/if}
    {#if mode === 'percent'}
      <label class="check"><input type="number" min="1" max="400" bind:value={percent} oninput={reprocess} style="width:6rem" /> %</label>
    {/if}
    {#if mode !== 'original' && mode !== 'percent'}
      <label class="check"><input type="checkbox" bind:checked={shrinkOnly} onchange={reprocess} /> Never enlarge</label>
    {/if}
  </div>

  {#if items.length}
    <table class="kv">
      <tbody>
        {#each items as i}
          <tr>
            <td style="width:64px">{#if i.url}<img src={i.url} alt="" style="width:56px;height:56px;object-fit:cover;border:1px solid var(--border)" />{/if}</td>
            <td>{i.name}
              {#if i.error}<div class="err">{i.error}</div>
              {:else}<div class="muted">{formatBytes(i.before)} → <strong>{formatBytes(i.blob!.size)}</strong> · {i.w}×{i.h} · {info.label}</div>{/if}</td>
            <td style="width:1%">{#if i.blob}<button class="opt" onclick={() => downloadBlob(i.blob!, outName(i.name))}>Save</button>{/if}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if items.filter((i) => i.blob).length > 1}<div><button class="opt on" onclick={saveZip}>Save all as ZIP</button></div>{/if}
  {/if}
</div>
