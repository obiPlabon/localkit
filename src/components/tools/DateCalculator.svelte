<script lang="ts">
  type Mode = 'diff' | 'age' | 'add';

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  let mode = $state<Mode>('diff');
  let start = $state(today());
  let end = $state(today());
  let birth = $state('1990-06-15');
  let asOf = $state(today());
  let inclusive = $state(false);
  let addN = $state(30);
  let addUnit = $state<'days' | 'weeks' | 'months' | 'years'>('days');
  let addSign = $state<1 | -1>(1);

  type YMD = { y: number; m: number; d: number };
  const parse = (s: string): YMD | null => {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  };
  const utc = (x: YMD) => Date.UTC(x.y, x.m - 1, x.d);
  const dim = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const DAY = 86400000;
  const fmtDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const plural = (n: number, w: string) => `${n.toLocaleString()} ${w}${n === 1 ? '' : 's'}`;

  /** Calendar difference between two dates, a <= b. */
  function ymd(a: YMD, b: YMD) {
    let y = b.y - a.y, m = b.m - a.m, d = b.d - a.d;
    if (d < 0) { m--; d += dim(b.m === 1 ? b.y - 1 : b.y, b.m === 1 ? 12 : b.m - 1); }
    if (m < 0) { y--; m += 12; }
    return { y, m, d };
  }
  function weekdaysBetween(a: number, b: number) {
    let n = 0;
    for (let t = a; t < b; t += DAY) { const w = new Date(t).getUTCDay(); if (w !== 0 && w !== 6) n++; }
    return n;
  }
  const parts = (r: { y: number; m: number; d: number }) =>
    [r.y && plural(r.y, 'year'), r.m && plural(r.m, 'month'), (r.d || (!r.y && !r.m)) && plural(r.d, 'day')].filter(Boolean).join(', ');

  const diff = $derived.by(() => {
    const a = parse(start), b = parse(end);
    if (!a || !b) return null;
    let x = a, y = b, negative = false;
    if (utc(a) > utc(b)) { x = b; y = a; negative = true; }
    const days = Math.round((utc(y) - utc(x)) / DAY) + (inclusive ? 1 : 0);
    return {
      negative, text: parts(ymd(x, y)), days, weeks: Math.floor(days / 7), remDays: days % 7,
      hours: days * 24, business: weekdaysBetween(utc(x), utc(y) + (inclusive ? DAY : 0)),
    };
  });

  const age = $derived.by(() => {
    const b = parse(birth), n = parse(asOf);
    if (!b || !n) return null;
    if (utc(b) > utc(n)) return { error: 'The birth date is after the “as of” date.' } as const;
    const r = ymd(b, n);
    // next birthday (Feb 29 falls on Mar 1 in common years)
    const nextFor = (year: number) => (b.m === 2 && b.d === 29 && dim(year, 2) === 28 ? Date.UTC(year, 2, 1) : Date.UTC(year, b.m - 1, b.d));
    let next = nextFor(n.y);
    if (next < utc(n)) next = nextFor(n.y + 1);
    const days = Math.round((utc(n) - utc(b)) / DAY);
    return { r, days, next, until: Math.round((next - utc(n)) / DAY), turns: r.y + (next === utc(n) ? 0 : 1) };
  });

  const added = $derived.by(() => {
    const a = parse(start);
    if (!a || !Number.isFinite(addN)) return null;
    const n = addSign * Math.floor(addN);
    if (addUnit === 'days' || addUnit === 'weeks') return utc(a) + n * (addUnit === 'weeks' ? 7 : 1) * DAY;
    const months = addUnit === 'years' ? n * 12 : n;
    const total = a.y * 12 + (a.m - 1) + months;
    const y = Math.floor(total / 12), m = (total % 12 + 12) % 12 + 1;
    return Date.UTC(y, m - 1, Math.min(a.d, dim(y, m)));
  });
</script>

<div class="tk">
  <div class="tk-row">
    <button class="opt" class:on={mode === 'diff'} onclick={() => (mode = 'diff')}>Days between</button>
    <button class="opt" class:on={mode === 'age'} onclick={() => (mode = 'age')}>Age</button>
    <button class="opt" class:on={mode === 'add'} onclick={() => (mode = 'add')}>Add / subtract</button>
  </div>

  {#if mode === 'diff'}
    <div class="tk-grid2">
      <div><label class="lbl" for="dc-s">From</label><input id="dc-s" type="date" bind:value={start} /></div>
      <div><label class="lbl" for="dc-e">To</label><input id="dc-e" type="date" bind:value={end} /></div>
    </div>
    <label class="check"><input type="checkbox" bind:checked={inclusive} /> Count the end date too</label>
    {#if diff}
      <div class="result"><b>{plural(diff.days, 'day')}</b><span>{diff.text}{diff.negative ? ' (end is before start)' : ''}</span></div>
      <div class="stat-grid">
        <div class="stat"><b>{diff.weeks.toLocaleString()}</b><span>Weeks{diff.remDays ? ` + ${diff.remDays} d` : ''}</span></div>
        <div class="stat"><b>{diff.business.toLocaleString()}</b><span>Weekdays</span></div>
        <div class="stat"><b>{diff.hours.toLocaleString()}</b><span>Hours</span></div>
      </div>
    {/if}
  {:else if mode === 'age'}
    <div class="tk-grid2">
      <div><label class="lbl" for="dc-b">Date of birth</label><input id="dc-b" type="date" bind:value={birth} /></div>
      <div><label class="lbl" for="dc-a">Age on</label><input id="dc-a" type="date" bind:value={asOf} /></div>
    </div>
    {#if age && 'error' in age}
      <p class="err" role="alert">{age.error}</p>
    {:else if age}
      <div class="result"><b>{age.r.y} {age.r.y === 1 ? 'year' : 'years'}</b><span>{parts(age.r)}</span></div>
      <div class="stat-grid">
        <div class="stat"><b>{age.days.toLocaleString()}</b><span>Days old</span></div>
        <div class="stat"><b>{age.until === 0 ? 'Today' : age.until.toLocaleString()}</b><span>{age.until === 0 ? 'Birthday!' : 'Days to birthday'}</span></div>
        <div class="stat"><b>{age.turns}</b><span>Next age</span></div>
      </div>
      <p class="muted">Next birthday: {fmtDate(age.next)}</p>
    {/if}
  {:else}
    <div class="tk-row">
      <div><label class="lbl" for="dc-st">Start date</label><input id="dc-st" type="date" bind:value={start} /></div>
      <div class="tk-row" style="align-self:flex-end">
        <button class="opt" class:on={addSign === 1} onclick={() => (addSign = 1)}>Add</button>
        <button class="opt" class:on={addSign === -1} onclick={() => (addSign = -1)}>Subtract</button>
      </div>
      <div><label class="lbl" for="dc-n">Amount</label><input id="dc-n" type="number" min="0" bind:value={addN} style="width:7rem" /></div>
      <div>
        <label class="lbl" for="dc-u">Unit</label>
        <select id="dc-u" bind:value={addUnit}>
          <option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option><option value="years">Years</option>
        </select>
      </div>
    </div>
    {#if added !== null}
      <div class="result"><b>{fmtDate(added)}</b><span>{new Date(added).toISOString().slice(0, 10)}</span></div>
    {/if}
  {/if}
</div>

<style>
  .result { border: 1px solid var(--border); background: var(--surface-2); padding: var(--s-4); display: grid; gap: .25rem; }
  .result b { font: 450 1.9rem/1.15 var(--font-display); color: var(--heading); letter-spacing: -.02em; overflow-wrap: anywhere; }
  .result span { color: var(--muted); font-size: var(--text-sm); }
</style>
