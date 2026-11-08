<script lang="ts">
  import { process, type SortMode } from '../../lib/tools/textsort';
  import { copyText } from '../../lib/tools/util';

  let input = $state('');
  let sort = $state<SortMode>('az');
  let ignoreCase = $state(true);
  let dedupe = $state(true);
  let removeEmpty = $state(true);
  let trim = $state(true);
  let collapse = $state(false);
  let seed = $state(0);
  let copied = $state(false);

  const result = $derived.by(() => {
    seed;
    return process(input, { sort, ignoreCase, dedupe, removeEmpty, trim, collapse });
  });
  const output = $derived(result.lines.join('\n'));

  async function copy() {
    copied = await copyText(output);
    setTimeout(() => (copied = false), 1200);
  }
</script>

<div class="tk">
  <div class="tk-row">
    <label class="check">Sort
      <select bind:value={sort}>
        <option value="none">Keep order</option>
        <option value="az">A → Z</option>
        <option value="za">Z → A</option>
        <option value="natural">Natural (file2 before file10)</option>
        <option value="short">Shortest first</option>
        <option value="long">Longest first</option>
        <option value="reverse">Reverse order</option>
        <option value="shuffle">Shuffle</option>
      </select></label>
    {#if sort === 'shuffle'}<button class="opt" onclick={() => seed++}>Reshuffle</button>{/if}
  </div>
  <div class="tk-row">
    <label class="check"><input type="checkbox" bind:checked={dedupe} /> Remove duplicates</label>
    <label class="check"><input type="checkbox" bind:checked={ignoreCase} /> Ignore case</label>
    <label class="check"><input type="checkbox" bind:checked={removeEmpty} /> Remove empty lines</label>
    <label class="check"><input type="checkbox" bind:checked={trim} /> Trim each line</label>
    <label class="check"><input type="checkbox" bind:checked={collapse} /> Collapse repeated spaces</label>
  </div>

  <div class="tk-grid2">
    <div>
      <label class="lbl" for="ts-in">Input</label>
      <textarea id="ts-in" bind:value={input} spellcheck="false" placeholder="One item per line"></textarea>
    </div>
    <div>
      <div class="tk-row between"><span class="lbl">Result</span>
        {#if output}<button class="opt" onclick={copy}>{copied ? 'Copied' : 'Copy'}</button>{/if}</div>
      <textarea class="out" readonly value={output} spellcheck="false"></textarea>
    </div>
  </div>

  {#if result.inCount}
    <p class="muted">
      {result.inCount} {result.inCount === 1 ? 'line' : 'lines'} in → {result.lines.length} out
      {#if result.duplicates} · {result.duplicates} duplicate{result.duplicates === 1 ? '' : 's'} removed{/if}
      {#if result.empties} · {result.empties} empty line{result.empties === 1 ? '' : 's'} removed{/if}
    </p>
  {/if}
</div>
