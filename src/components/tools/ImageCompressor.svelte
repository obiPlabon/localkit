<script lang="ts">
  import { downloadBlob, formatBytes } from '../../lib/tools/util';
  import { compress } from '../../lib/image/client';
  import { engines, formatInfo, type EngineId, type Format } from '../../lib/image/engines';

  type Item = { name: string; before: number; blob?: Blob; url?: string; w: number; h: number; error?: string };

  let items = $state<Item[]>([]);
  let engine = $state<EngineId>('browser');
  let format = $state<Format>('webp');
  let quality = $state(75);
  let maxW = $state(0);
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

  async function process() {
    const id = ++run;
    busy = true;
    const out: Item[] = [];
    for (const f of files) {
      const it: Item = { name: f.name, before: f.size, w: 0, h: 0 };
      try {
        const r = await compress(f, { engine, format, quality, maxWidth: maxW });
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
    timer = setTimeout(process, 300);
  }

  const outName = (n: string) => n.replace(/\.[^.]+$/, '') + `-compressed.${info.ext}`;
  const saving = (i: Item) => (i.blob ? Math.round((1 - i.blob.size / i.before) * 100) : 0);
  function saveAll() { items.forEach((i) => i.blob && downloadBlob(i.blob, outName(i.name))); }
</script>

<div class="tk">
  <label
    class="dropzone" class:dragging
    ondragover={(e) => { e.preventDefault(); dragging = true; }}
    ondragleave={() => (dragging = false)}
    ondrop={(e) => { e.preventDefault(); dragging = false; add(e.dataTransfer?.files); }}
  >
    <input type="file" accept="image/*" multiple hidden onchange={(e) => add(e.currentTarget.files)} />
    <strong>{busy ? 'Compressing…' : 'Drop images here'}</strong>
    <span>or click to choose · JPG, PNG, WebP, GIF, BMP</span>
    <small>🔒 Compressed on your device. Nothing is uploaded.</small>
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
    <label class="check">Format
      <select bind:value={format} onchange={reprocess} style="width:auto">
        {#each eng.formats as f}<option value={f}>{formatInfo[f].label}</option>{/each}
      </select></label>
    <label class="check" class:muted={!info.lossy}>Quality {info.lossy ? quality : '(lossless)'}
      <input type="range" min="10" max="100" bind:value={quality} oninput={reprocess} disabled={!info.lossy} /></label>
    <label class="check">Max width
      <input type="number" min="0" step="100" bind:value={maxW} oninput={reprocess} style="width:6rem" placeholder="0" /> px (0 = original)</label>
  </div>

  {#if items.length}
    <table class="kv">
      <tbody>
        {#each items as i}
          <tr>
            <td style="width:64px">{#if i.url}<img src={i.url} alt="" style="width:56px;height:56px;object-fit:cover;border:1px solid var(--border)" />{/if}</td>
            <td>{i.name}
              {#if i.error}<div class="err">{i.error}</div>
              {:else}<div class="muted">{formatBytes(i.before)} → <strong>{formatBytes(i.blob!.size)}</strong>
                ({saving(i) >= 0 ? `−${saving(i)}%` : `+${-saving(i)}%`}) · {i.w}×{i.h}</div>{/if}</td>
            <td style="width:1%">{#if i.blob}<button class="opt" onclick={() => downloadBlob(i.blob!, outName(i.name))}>Save</button>{/if}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if items.filter((i) => i.blob).length > 1}<div><button class="opt on" onclick={saveAll}>Save all</button></div>{/if}
  {/if}
</div>
