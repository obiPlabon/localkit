<script lang="ts">
  import { categories, convert, fmt } from '../../lib/tools/units';
  import { copyText } from '../../lib/tools/util';

  let catId = $state('length');
  let value = $state('1');
  let from = $state('m');
  let copied = $state('');

  const cat = $derived(categories.find((c) => c.id === catId)!);
  const num = $derived(value.trim() === '' ? NaN : Number(value.replace(/,/g, '')));
  const results = $derived(num === num ? cat.units.map((u) => ({ u, v: convert(num, from, u.id, cat) })) : []);

  function setCat(id: string) {
    catId = id;
    const c = categories.find((x) => x.id === id)!;
    from = c.units.find((u) => u.f === 1 && !c.temperature)?.id ?? c.units[0].id;
  }
  function swap(to: string) {
    const r = results.find((x) => x.u.id === to);
    if (r) { value = String(Number(r.v.toPrecision(12))); from = to; }
  }
  async function copy(id: string, text: string) {
    if (await copyText(text)) { copied = id; setTimeout(() => (copied = ''), 1200); }
  }
</script>

<div class="tk">
  <div class="tk-row">
    {#each categories as c}
      <button class="opt" class:on={catId === c.id} onclick={() => setCat(c.id)}>{c.label}</button>
    {/each}
  </div>

  <div class="tk-row">
    <div style="flex:1;min-width:10rem">
      <label class="lbl" for="uc-val">Value</label>
      <input id="uc-val" type="text" inputmode="decimal" bind:value autocomplete="off" spellcheck="false" />
    </div>
    <div>
      <label class="lbl" for="uc-from">From</label>
      <select id="uc-from" bind:value={from}>
        {#each cat.units as u}<option value={u.id}>{u.name} ({u.label})</option>{/each}
      </select>
    </div>
  </div>

  {#if num !== num && value.trim() !== ''}
    <p class="err" role="alert">Enter a number.</p>
  {:else if results.length}
    <table class="kv">
      <tbody>
        {#each results as r}
          <tr class:self={r.u.id === from}>
            <th>{r.u.name}</th>
            <td class="mono-out"><strong>{fmt(r.v)}</strong> <span class="muted">{r.u.label}</span></td>
            <td style="text-align:right;width:1%;white-space:nowrap">
              <button class="opt" onclick={() => swap(r.u.id)} title="Use this as the starting unit">Use</button>
              <button class="opt" onclick={() => copy(r.u.id, fmt(r.v).replace(/,/g, ''))}>{copied === r.u.id ? 'Copied' : 'Copy'}</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  tr.self { background: var(--accent-soft); }
</style>
