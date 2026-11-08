<script lang="ts">
  type Mode = 'of' | 'what' | 'change' | 'adjust' | 'tip';

  let mode = $state<Mode>('of');
  let a = $state('15');
  let b = $state('200');
  let sign = $state<1 | -1>(1);
  // tip
  let bill = $state('86.40');
  let tipPct = $state(15);
  let people = $state(2);
  let roundUp = $state(false);

  const n = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(/,/g, '')));
  const A = $derived(n(a)), B = $derived(n(b));
  const round = (x: number) => Math.round(x * 1e6) / 1e6;
  const money = (x: number) => x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (x: number) => round(x).toLocaleString(undefined, { maximumFractionDigits: 6 });

  const out = $derived.by(() => {
    if (Number.isNaN(A) || Number.isNaN(B)) return null;
    if (mode === 'of') return { big: num((A / 100) * B), line: `${num(A)}% of ${num(B)}` };
    if (mode === 'what') return B === 0 ? null : { big: `${num((A / B) * 100)}%`, line: `${num(A)} is this share of ${num(B)}` };
    if (mode === 'change') {
      if (A === 0) return null;
      const c = ((B - A) / Math.abs(A)) * 100;
      return { big: `${c >= 0 ? '+' : ''}${num(c)}%`, line: `${c >= 0 ? 'Increase' : 'Decrease'} from ${num(A)} to ${num(B)}` };
    }
    // adjust: B is the base, A the percent
    return { big: num(B * (1 + (sign * A) / 100)), line: `${num(B)} ${sign === 1 ? '+' : '−'} ${num(A)}%` };
  });

  const tip = $derived.by(() => {
    const total = n(bill);
    if (Number.isNaN(total) || total < 0) return null;
    const p = Math.max(1, Math.floor(people) || 1);
    const tipAmt = (total * tipPct) / 100;
    let grand = total + tipAmt;
    let each = grand / p;
    if (roundUp) { each = Math.ceil(each); grand = each * p; }
    return { tipAmt: grand - total, grand, each, p };
  });

  const labels: Record<Mode, string> = { of: '% of a number', what: 'X is what %', change: '% change', adjust: 'Add / subtract %', tip: 'Tip & split' };
</script>

<div class="tk">
  <div class="tk-row">
    {#each Object.keys(labels) as m}
      <button class="opt" class:on={mode === m} onclick={() => (mode = m as Mode)}>{labels[m as Mode]}</button>
    {/each}
  </div>

  {#if mode !== 'tip'}
    <div class="tk-grid2">
      <div>
        <label class="lbl" for="pc-a">{mode === 'of' || mode === 'adjust' ? 'Percent' : mode === 'change' ? 'From' : 'Value'}</label>
        <input id="pc-a" type="text" inputmode="decimal" bind:value={a} autocomplete="off" />
      </div>
      <div>
        <label class="lbl" for="pc-b">{mode === 'of' ? 'Of' : mode === 'what' ? 'Out of' : mode === 'change' ? 'To' : 'Starting number'}</label>
        <input id="pc-b" type="text" inputmode="decimal" bind:value={b} autocomplete="off" />
      </div>
    </div>
    {#if mode === 'adjust'}
      <div class="tk-row">
        <button class="opt" class:on={sign === 1} onclick={() => (sign = 1)}>Add</button>
        <button class="opt" class:on={sign === -1} onclick={() => (sign = -1)}>Subtract</button>
      </div>
    {/if}
    {#if out}
      <div class="result"><b>{out.big}</b><span>{out.line}</span></div>
    {:else}
      <p class="muted">Enter two numbers{mode === 'what' || mode === 'change' ? ' (the divisor cannot be zero)' : ''}.</p>
    {/if}
  {:else}
    <div class="tk-grid2">
      <div>
        <label class="lbl" for="tp-bill">Bill</label>
        <input id="tp-bill" type="text" inputmode="decimal" bind:value={bill} autocomplete="off" />
      </div>
      <div>
        <label class="lbl" for="tp-people">People</label>
        <input id="tp-people" type="number" min="1" bind:value={people} />
      </div>
    </div>
    <div>
      <span class="lbl">Tip {tipPct}%</span>
      <div class="tk-row">
        {#each [0, 10, 15, 18, 20, 25] as t}
          <button class="opt" class:on={tipPct === t} onclick={() => (tipPct = t)}>{t}%</button>
        {/each}
        <input type="range" min="0" max="40" bind:value={tipPct} aria-label="Tip percent" style="flex:1;min-width:8rem" />
      </div>
    </div>
    <label class="check"><input type="checkbox" bind:checked={roundUp} /> Round each share up to a whole number</label>
    {#if tip}
      <div class="stat-grid">
        <div class="stat"><b>{money(tip.tipAmt)}</b><span>Tip</span></div>
        <div class="stat"><b>{money(tip.grand)}</b><span>Total</span></div>
        <div class="stat"><b>{money(tip.each)}</b><span>Each ({tip.p})</span></div>
      </div>
    {:else}
      <p class="muted">Enter the bill amount.</p>
    {/if}
  {/if}
</div>

<style>
  .result { border: 1px solid var(--border); background: var(--surface-2); padding: var(--s-4); display: grid; gap: .25rem; }
  .result b { font: 450 2.4rem/1.1 var(--font-display); color: var(--heading); letter-spacing: -.02em; overflow-wrap: anywhere; }
  .result span { color: var(--muted); font-size: var(--text-sm); }
</style>
