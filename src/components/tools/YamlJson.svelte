<script lang="ts">
  import { parse, stringify, parseAllDocuments } from 'yaml';
  import { copyText } from '../../lib/tools/util';

  let mode = $state<'yaml2json' | 'json2yaml'>('yaml2json');
  let input = $state('');
  let indent = $state(2);
  let copied = $state(false);

  const result = $derived.by(() => {
    if (!input.trim()) return { out: '', err: '', note: '' };
    try {
      if (mode === 'yaml2json') {
        const docs = parseAllDocuments(input);
        for (const d of docs) if (d.errors.length) throw d.errors[0];
        if (docs.length > 1) return { out: JSON.stringify(docs.map((d) => d.toJS()), null, indent), err: '', note: `${docs.length} documents found, output as an array.` };
        return { out: JSON.stringify(parse(input), null, indent), err: '', note: '' };
      }
      return { out: stringify(JSON.parse(input), { indent }), err: '', note: '' };
    } catch (e) {
      return { out: '', err: e instanceof Error ? e.message : 'Could not convert.', note: '' };
    }
  });

  async function copy() {
    copied = await copyText(result.out);
    setTimeout(() => (copied = false), 1200);
  }
</script>

<div class="tk">
  <div class="tk-row">
    <button class="opt" class:on={mode === 'yaml2json'} onclick={() => (mode = 'yaml2json')}>YAML → JSON</button>
    <button class="opt" class:on={mode === 'json2yaml'} onclick={() => (mode = 'json2yaml')}>JSON → YAML</button>
    <select bind:value={indent} aria-label="Indent" style="width:auto">
      <option value={2}>2 spaces</option>
      <option value={4}>4 spaces</option>
    </select>
  </div>
  <div class="tk-grid2">
    <div>
      <label class="lbl" for="yj-in">{mode === 'yaml2json' ? 'YAML' : 'JSON'}</label>
      <textarea id="yj-in" bind:value={input} spellcheck="false" placeholder={mode === 'yaml2json' ? 'name: Ada\nroles:\n  - admin' : '{"name":"Ada"}'}></textarea>
    </div>
    <div>
      <div class="tk-row between"><span class="lbl">{mode === 'yaml2json' ? 'JSON' : 'YAML'}</span>
        {#if result.out}<button class="opt" onclick={copy}>{copied ? 'Copied' : 'Copy'}</button>{/if}</div>
      <textarea class="out" readonly value={result.out} spellcheck="false"></textarea>
    </div>
  </div>
  {#if result.err}<p class="err" role="alert">{result.err}</p>{/if}
  {#if result.note}<p class="muted">{result.note}</p>{/if}
</div>
