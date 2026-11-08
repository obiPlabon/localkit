<script lang="ts">
  import { parseColor, formats, contrast, toHexString, type RGBA } from '../../lib/tools/color';
  import { copyText } from '../../lib/tools/util';

  let text = $state('#4f46e5');
  let fgText = $state('#1e1b4b');
  let bgText = $state('#ffffff');
  let copiedKey = $state('');

  const color = $derived(parseColor(text));
  const fg = $derived(parseColor(fgText));
  const bg = $derived(parseColor(bgText));
  const ratio = $derived(fg && bg ? contrast(fg, bg) : null);

  function picker(c: RGBA | null) {
    return c ? toHexString(c) : '#000000';
  }

  async function copy(key: string, v: string) {
    if (await copyText(v)) {
      copiedKey = key;
      setTimeout(() => (copiedKey = ''), 1200);
    }
  }

  const badge = (ok: boolean) => (ok ? 'Pass' : 'Fail');
</script>

<div class="tk">
  <div class="tk-row">
    <input type="color" class="swatch-input" aria-label="Pick a color" value={picker(color)} oninput={(e) => (text = e.currentTarget.value)} />
    <input type="text" bind:value={text} spellcheck="false" autocomplete="off" aria-label="Color value" placeholder="#4f46e5, rgb(79 70 229), hsl(243 75% 59%)" style="flex:1;min-width:14rem;font-family:var(--font-mono)" />
  </div>

  {#if color}
    <div class="preview" style="--c: rgba({color.r},{color.g},{color.b},{color.a})"></div>
    <table class="kv">
      <tbody>
        {#each formats(color) as f}
          <tr>
            <th>{f.label}</th>
            <td class="mono-out">{f.value}</td>
            <td style="text-align:right;width:1%"><button class="opt" onclick={() => copy(f.label, f.value)}>{copiedKey === f.label ? 'Copied' : 'Copy'}</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p class="err" role="alert">Not a recognised color. Try HEX, rgb() or hsl().</p>
  {/if}

  <hr class="rule" />

  <span class="lbl">Contrast checker (WCAG)</span>
  <div class="tk-grid2">
    <div class="tk-row">
      <input type="color" class="swatch-input" aria-label="Text color" value={picker(fg)} oninput={(e) => (fgText = e.currentTarget.value)} />
      <div style="flex:1"><label class="lbl" for="fg">Text</label><input id="fg" type="text" bind:value={fgText} spellcheck="false" style="font-family:var(--font-mono)" /></div>
    </div>
    <div class="tk-row">
      <input type="color" class="swatch-input" aria-label="Background color" value={picker(bg)} oninput={(e) => (bgText = e.currentTarget.value)} />
      <div style="flex:1"><label class="lbl" for="bg">Background</label><input id="bg" type="text" bind:value={bgText} spellcheck="false" style="font-family:var(--font-mono)" /></div>
    </div>
  </div>

  {#if fg && bg && ratio !== null}
    <div class="sample" style="color:{toHexString(fg)};background:{toHexString(bg)}">
      <b>Sample heading</b>
      <span>The quick brown fox jumps over the lazy dog.</span>
    </div>
    <div class="stat-grid">
      <div class="stat"><b>{ratio.toFixed(2)}:1</b><span>Contrast ratio</span></div>
      <div class="stat"><b>{badge(ratio >= 4.5)}</b><span>AA text</span></div>
      <div class="stat"><b>{badge(ratio >= 3)}</b><span>AA large text</span></div>
      <div class="stat"><b>{badge(ratio >= 7)}</b><span>AAA text</span></div>
      <div class="stat"><b>{badge(ratio >= 4.5)}</b><span>AAA large text</span></div>
    </div>
  {:else}
    <p class="err" role="alert">Enter two valid colors.</p>
  {/if}
</div>

<style>
  .swatch-input { width: 3rem; height: 3rem; padding: 0; border: 1px solid var(--border-strong); background: none; cursor: pointer; flex: none; }
  .preview {
    height: 6rem; border: 1px solid var(--border-strong); border-radius: var(--r-md);
    background: linear-gradient(var(--c), var(--c)),
      conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0) 0 0 / 16px 16px;
  }
  .rule { border: 0; border-top: 1px solid var(--border); width: 100%; margin: 0; }
  .sample { padding: var(--s-4); border: 1px solid var(--border-strong); display: grid; gap: .25rem; }
  .sample b { font: 450 1.4rem/1.2 var(--font-display); }
</style>
