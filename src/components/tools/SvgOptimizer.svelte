<script lang="ts">
  import { optimize } from 'svgo/browser';
  import { copyText, downloadBlob, formatBytes } from '../../lib/tools/util';

  let src = $state('');
  let name = $state('image.svg');
  let multipass = $state(true);
  let pretty = $state(false);
  let precision = $state(3);
  let removeDimensions = $state(false);
  let removeViewBox = $state(false);
  let copied = $state(false);

  const result = $derived.by(() => {
    if (!src.trim()) return { out: '', err: '' };
    try {
      const plugins: any[] = [
        { name: 'preset-default', params: { overrides: { removeViewBox: removeViewBox ? undefined : false } } },
      ];
      if (removeDimensions) plugins.push('removeDimensions');
      const r = optimize(src, { multipass, floatPrecision: precision, js2svg: { pretty, indent: 2 }, plugins });
      return { out: r.data, err: '' };
    } catch (e) {
      return { out: '', err: e instanceof Error ? e.message : 'Could not parse this SVG.' };
    }
  });

  const bytes = (s: string) => new TextEncoder().encode(s).length;
  const before = $derived(bytes(src));
  const after = $derived(bytes(result.out));
  const saved = $derived(before ? Math.round((1 - after / before) * 100) : 0);
  const svgUrl = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

  async function onFile(f: File | undefined) {
    if (!f) return;
    name = f.name;
    src = await f.text();
  }
  async function copy() {
    copied = await copyText(result.out);
    setTimeout(() => (copied = false), 1200);
  }
  const save = () => downloadBlob(new Blob([result.out], { type: 'image/svg+xml' }), name.replace(/\.svg$/i, '') + '.min.svg');
</script>

<div class="tk">
  <div class="tk-row">
    <input type="file" accept=".svg,image/svg+xml" onchange={(e) => onFile(e.currentTarget.files?.[0])} />
    <label class="check"><input type="checkbox" bind:checked={multipass} /> Multipass</label>
    <label class="check"><input type="checkbox" bind:checked={pretty} /> Pretty-print</label>
    <label class="check"><input type="checkbox" bind:checked={removeViewBox} /> Remove viewBox</label>
    <label class="check"><input type="checkbox" bind:checked={removeDimensions} /> Remove width/height</label>
    <label class="check">Precision {precision}
      <input type="range" min="0" max="6" bind:value={precision} /></label>
  </div>

  <div class="tk-grid2">
    <div>
      <label class="lbl" for="svg-in">SVG source</label>
      <textarea id="svg-in" bind:value={src} spellcheck="false" placeholder="Paste SVG markup, or choose a file"></textarea>
    </div>
    <div>
      <div class="tk-row between"><span class="lbl">Optimized</span>
        {#if result.out}<span class="tk-row"><button class="opt" onclick={copy}>{copied ? 'Copied' : 'Copy'}</button><button class="opt" onclick={save}>Save</button></span>{/if}</div>
      <textarea class="out" readonly value={result.out} spellcheck="false"></textarea>
    </div>
  </div>
  {#if result.err}<p class="err" role="alert">{result.err}</p>{/if}

  {#if result.out}
    <div class="stat-grid">
      <div class="stat"><b>{formatBytes(before)}</b><span>Before</span></div>
      <div class="stat"><b>{formatBytes(after)}</b><span>After</span></div>
      <div class="stat"><b>{saved >= 0 ? `−${saved}%` : `+${-saved}%`}</b><span>Saved</span></div>
    </div>
    <div class="tk-grid2">
      <div><span class="lbl">Before</span><div class="pv"><img src={svgUrl(src)} alt="Original SVG" /></div></div>
      <div><span class="lbl">After</span><div class="pv"><img src={svgUrl(result.out)} alt="Optimized SVG" /></div></div>
    </div>
  {/if}
</div>

<style>
  .pv { display: grid; place-items: center; min-height: 12rem; padding: var(--s-3); border: 1px solid var(--border);
    background: conic-gradient(var(--surface-2) 25%, var(--surface) 0 50%, var(--surface-2) 0 75%, var(--surface) 0) 0 0 / 16px 16px; }
  .pv img { max-width: 100%; max-height: 16rem; }
</style>
