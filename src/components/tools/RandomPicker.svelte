<script lang="ts">
  import { randInt, pick, shuffle } from '../../lib/tools/random';
  import { copyText } from '../../lib/tools/util';

  type Mode = 'pick' | 'dice' | 'coin' | 'number';
  let mode = $state<Mode>('pick');

  // picker
  let items = $state('Alice\nBob\nCarol\nDmitri\nEvelyn');
  let winners = $state(1);
  let unique = $state(true);
  let picked = $state<string[]>([]);
  // dice
  let diceCount = $state(2);
  let sides = $state(6);
  let rolls = $state<number[]>([]);
  // coin
  let flips = $state(1);
  let coins = $state<('H' | 'T')[]>([]);
  // number
  let min = $state(1);
  let max = $state(100);
  let howMany = $state(1);
  let uniqueNums = $state(true);
  let nums = $state<number[]>([]);
  let err = $state('');
  let copied = $state(false);

  const list = $derived(items.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));

  function doPick() {
    err = '';
    if (!list.length) { err = 'Add at least one item.'; return; }
    const n = Math.max(1, Math.floor(winners) || 1);
    if (unique && n > list.length) { err = `Only ${list.length} items to choose from.`; return; }
    picked = pick(list, n, unique);
  }
  const doShuffle = () => { err = ''; picked = shuffle(list); };
  function roll() {
    const n = Math.min(100, Math.max(1, Math.floor(diceCount) || 1));
    rolls = Array.from({ length: n }, () => randInt(sides) + 1);
  }
  function flip() {
    const n = Math.min(1000, Math.max(1, Math.floor(flips) || 1));
    coins = Array.from({ length: n }, () => (randInt(2) ? 'H' : 'T'));
  }
  function doNumbers() {
    err = '';
    const lo = Math.floor(min), hi = Math.floor(max), n = Math.min(1000, Math.max(1, Math.floor(howMany) || 1));
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo > hi) { err = 'The minimum must not be above the maximum.'; return; }
    const span = hi - lo + 1;
    if (uniqueNums && n > span) { err = `Only ${span} different numbers fit in that range.`; return; }
    if (uniqueNums) {
      const seen = new Set<number>();
      while (seen.size < n) seen.add(lo + randInt(span));
      nums = [...seen];
    } else nums = Array.from({ length: n }, () => lo + randInt(span));
  }

  const heads = $derived(coins.filter((c) => c === 'H').length);
  const sum = $derived(rolls.reduce((a, b) => a + b, 0));

  async function copy(t: string) {
    copied = await copyText(t);
    setTimeout(() => (copied = false), 1200);
  }
</script>

<div class="tk">
  <div class="tk-row">
    <button class="opt" class:on={mode === 'pick'} onclick={() => (mode = 'pick')}>Name picker</button>
    <button class="opt" class:on={mode === 'dice'} onclick={() => (mode = 'dice')}>Dice</button>
    <button class="opt" class:on={mode === 'coin'} onclick={() => (mode = 'coin')}>Coin flip</button>
    <button class="opt" class:on={mode === 'number'} onclick={() => (mode = 'number')}>Random number</button>
  </div>

  {#if mode === 'pick'}
    <div>
      <label class="lbl" for="rp-items">Items, one per line ({list.length})</label>
      <textarea id="rp-items" bind:value={items} spellcheck="false" style="min-height:9rem"></textarea>
    </div>
    <div class="tk-row">
      <label class="check">Pick <input type="number" min="1" bind:value={winners} style="width:5rem" /></label>
      <label class="check"><input type="checkbox" bind:checked={unique} /> No repeats</label>
      <button class="opt on" onclick={doPick}>Pick</button>
      <button class="opt" onclick={doShuffle}>Shuffle all</button>
    </div>
    {#if picked.length}
      <div class="result">
        {#if picked.length === 1}<b>{picked[0]}</b>{:else}<ol>{#each picked as p}<li>{p}</li>{/each}</ol>{/if}
        <button class="opt" onclick={() => copy(picked.join('\n'))}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
    {/if}
  {:else if mode === 'dice'}
    <div class="tk-row">
      <label class="check">Dice <input type="number" min="1" max="100" bind:value={diceCount} style="width:5rem" /></label>
      <label class="check">Sides
        <select bind:value={sides}>{#each [4, 6, 8, 10, 12, 20, 100] as s}<option value={s}>d{s}</option>{/each}</select></label>
      <button class="opt on" onclick={roll}>Roll</button>
    </div>
    {#if rolls.length}
      <div class="result">
        <div class="dice">{#each rolls as r}<span class="die">{r}</span>{/each}</div>
        {#if rolls.length > 1}<span class="muted">Total <strong>{sum}</strong> · average {(sum / rolls.length).toFixed(1)}</span>{/if}
      </div>
    {/if}
  {:else if mode === 'coin'}
    <div class="tk-row">
      <label class="check">Flips <input type="number" min="1" max="1000" bind:value={flips} style="width:5.5rem" /></label>
      <button class="opt on" onclick={flip}>Flip</button>
    </div>
    {#if coins.length}
      <div class="result">
        {#if coins.length === 1}<b>{coins[0] === 'H' ? 'Heads' : 'Tails'}</b>
        {:else}
          <b>{heads} heads · {coins.length - heads} tails</b>
          <span class="mono-out muted">{coins.join(' ')}</span>
        {/if}
      </div>
    {/if}
  {:else}
    <div class="tk-row">
      <label class="check">From <input type="number" bind:value={min} style="width:7rem" /></label>
      <label class="check">To <input type="number" bind:value={max} style="width:7rem" /></label>
      <label class="check">How many <input type="number" min="1" max="1000" bind:value={howMany} style="width:5.5rem" /></label>
      <label class="check"><input type="checkbox" bind:checked={uniqueNums} /> No repeats</label>
      <button class="opt on" onclick={doNumbers}>Generate</button>
    </div>
    {#if nums.length}
      <div class="result">
        {#if nums.length === 1}<b>{nums[0]}</b>{:else}<span class="mono-out">{nums.join(', ')}</span>{/if}
        <button class="opt" onclick={() => copy(nums.join(', '))}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
    {/if}
  {/if}
  {#if err}<p class="err" role="alert">{err}</p>{/if}
  <p class="muted">Uses your browser’s secure random generator, with no bias toward any value.</p>
</div>

<style>
  .result { border: 1px solid var(--border); background: var(--surface-2); padding: var(--s-4); display: grid; gap: var(--s-2); justify-items: start; }
  .result b { font: 450 2.2rem/1.1 var(--font-display); color: var(--heading); overflow-wrap: anywhere; }
  .result ol { margin: 0; padding-left: 1.4rem; font: 450 1.3rem/1.5 var(--font-display); color: var(--heading); }
  .dice { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .die { display: grid; place-items: center; min-width: 3rem; height: 3rem; padding: 0 .4rem; border: 2px solid var(--accent); background: var(--surface); color: var(--accent); font: 450 1.3rem/1 var(--font-display); border-radius: var(--r-md); }
</style>
