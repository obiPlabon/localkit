<script lang="ts">
  import { copyText } from '../../lib/tools/util';

  let input = $state('');
  let indent = $state('2');
  let sortKeys = $state(false);
  let output = $state('');
  let error = $state('');
  let copied = $state(false);

  function sortDeep(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === 'object')
      return Object.fromEntries(Object.entries(v as object).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, sortDeep(x)]));
    return v;
  }

  function run(minify: boolean) {
    error = '';
    if (!input.trim()) { output = ''; return; }
    try {
      let v = JSON.parse(input);
      if (sortKeys) v = sortDeep(v);
      output = minify ? JSON.stringify(v) : JSON.stringify(v, null, indent === 'tab' ? '\t' : Number(indent));
    } catch (e) {
      output = '';
      const msg = e instanceof Error ? e.message : 'Invalid JSON.';
      const m = /position (\d+)/.exec(msg);
      if (m) {
        const pos = Number(m[1]);
        const before = input.slice(0, pos).split('\n');
        error = `${msg} (line ${before.length}, column ${before[before.length - 1].length + 1})`;
      } else error = msg;
    }
  }

  async function copy() {
    copied = await copyText(output);
    setTimeout(() => (copied = false), 1200);
  }
</script>

<div class="tk">
  <div>
    <label class="lbl" for="json-in">Input</label>
    <textarea id="json-in" bind:value={input} placeholder="Paste JSON here" spellcheck="false"></textarea>
  </div>
  <div class="tk-row">
    <button class="opt on" onclick={() => run(false)}>Format</button>
    <button class="opt" onclick={() => run(true)}>Minify</button>
    <select bind:value={indent} aria-label="Indent" style="width:auto">
      <option value="2">2 spaces</option>
      <option value="4">4 spaces</option>
      <option value="tab">Tab</option>
    </select>
    <label class="check"><input type="checkbox" bind:checked={sortKeys} /> Sort keys</label>
  </div>
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  {#if output}
    <div>
      <div class="tk-row between"><span class="lbl">Output · {output.length.toLocaleString()} chars</span>
        <button class="opt" onclick={copy}>{copied ? 'Copied' : 'Copy'}</button></div>
      <textarea class="out" readonly value={output} spellcheck="false"></textarea>
    </div>
  {/if}
</div>
