<script lang="ts">
  import { copyText, downloadBlob } from '../../lib/tools/util';
  import { csvToJson, jsonToCsv, sniffDelimiter } from '../../lib/tools/csv';

  let mode = $state<'csv2json' | 'json2csv'>('csv2json');
  let input = $state('');
  let delimChoice = $state<'auto' | ',' | ';' | '\t' | '|'>('auto');
  let header = $state(true);
  let infer = $state(true);
  let copied = $state(false);

  const result = $derived.by(() => {
    if (!input.trim()) return { out: '', err: '' };
    try {
      if (mode === 'csv2json') {
        const d = delimChoice === 'auto' ? sniffDelimiter(input) : delimChoice;
        return { out: JSON.stringify(csvToJson(input, d, header, infer), null, 2), err: '' };
      }
      const d = delimChoice === 'auto' ? ',' : delimChoice;
      return { out: jsonToCsv(JSON.parse(input), d), err: '' };
    } catch (e) {
      return { out: '', err: e instanceof Error ? e.message : 'Could not convert.' };
    }
  });

  async function onFile(f: File | undefined) {
    if (f) input = await f.text();
  }
  async function copy() {
    copied = await copyText(result.out);
    setTimeout(() => (copied = false), 1200);
  }
  function save() {
    const csv = mode === 'json2csv';
    downloadBlob(new Blob([result.out], { type: csv ? 'text/csv' : 'application/json' }), csv ? 'data.csv' : 'data.json');
  }
</script>

<div class="tk">
  <div class="tk-row">
    <button class="opt" class:on={mode === 'csv2json'} onclick={() => (mode = 'csv2json')}>CSV → JSON</button>
    <button class="opt" class:on={mode === 'json2csv'} onclick={() => (mode = 'json2csv')}>JSON → CSV</button>
    <select bind:value={delimChoice} aria-label="Delimiter" style="width:auto">
      <option value="auto">{mode === 'csv2json' ? 'Delimiter: auto' : 'Delimiter: comma'}</option>
      <option value=",">Comma</option>
      <option value=";">Semicolon</option>
      <option value="	">Tab</option>
      <option value="|">Pipe</option>
    </select>
    {#if mode === 'csv2json'}
      <label class="check"><input type="checkbox" bind:checked={header} /> First row is header</label>
      <label class="check"><input type="checkbox" bind:checked={infer} /> Detect numbers and booleans</label>
    {/if}
  </div>
  <div class="tk-grid2">
    <div>
      <div class="tk-row between">
        <label class="lbl" for="cj-in">{mode === 'csv2json' ? 'CSV' : 'JSON'}</label>
        <input type="file" accept=".csv,.tsv,.json,.txt,text/*" onchange={(e) => onFile(e.currentTarget.files?.[0])} />
      </div>
      <textarea id="cj-in" bind:value={input} spellcheck="false" placeholder={mode === 'csv2json' ? 'name,age\nAda,36' : '[{"name":"Ada","age":36}]'}></textarea>
    </div>
    <div>
      <div class="tk-row between"><span class="lbl">{mode === 'csv2json' ? 'JSON' : 'CSV'}</span>
        {#if result.out}<span class="tk-row"><button class="opt" onclick={copy}>{copied ? 'Copied' : 'Copy'}</button><button class="opt" onclick={save}>Save</button></span>{/if}</div>
      <textarea class="out" readonly value={result.out} spellcheck="false"></textarea>
    </div>
  </div>
  {#if result.err}<p class="err" role="alert">{result.err}</p>{/if}
</div>
