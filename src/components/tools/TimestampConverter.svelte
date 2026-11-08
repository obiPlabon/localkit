<script lang="ts">
  import { copyText } from '../../lib/tools/util';

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  let tsInput = $state('');
  let dtInput = $state('');
  let copied = $state('');

  const parsed = $derived.by(() => {
    const t = tsInput.trim();
    if (!t) return null;
    if (!/^-?\d+(\.\d+)?$/.test(t)) return { error: 'Enter a number.' };
    const n = Number(t);
    const abs = Math.abs(n);
    const unit = abs >= 1e17 ? 'ns' : abs >= 1e14 ? 'µs' : abs >= 1e11 ? 'ms' : 's';
    const ms = unit === 's' ? n * 1000 : unit === 'ms' ? n : unit === 'µs' ? n / 1000 : n / 1e6;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? { error: 'Out of range.' } : { d, unit };
  });

  const fromDt = $derived.by(() => {
    if (!dtInput) return null;
    const d = new Date(dtInput);
    return isNaN(d.getTime()) ? null : d;
  });

  function rows(d: Date) {
    const diff = Math.round((d.getTime() - now) / 1000);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
    const [u, sec] = units.find(([, s]) => Math.abs(diff) >= s) ?? units[5];
    return [
      ['Local', d.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' })],
      ['UTC', d.toUTCString()],
      ['ISO 8601', d.toISOString()],
      ['Unix (s)', String(Math.floor(d.getTime() / 1000))],
      ['Unix (ms)', String(d.getTime())],
      ['Relative', rtf.format(Math.round(diff / sec), u)],
    ];
  }

  async function copy(v: string) {
    if (await copyText(v)) { copied = v; setTimeout(() => (copied = ''), 1200); }
  }
</script>

{#snippet table(d: Date)}
  <table class="kv">
    <tbody>
      {#each rows(d) as [k, v]}
        <tr><th>{k}</th><td class="mono-out">{v}</td>
          <td style="width:1%"><button class="opt" onclick={() => copy(v)}>{copied === v ? 'Copied' : 'Copy'}</button></td></tr>
      {/each}
    </tbody>
  </table>
{/snippet}

<div class="tk">
  <div class="stat-grid">
    <div class="stat"><b>{Math.floor(now / 1000)}</b><span>Now · Unix seconds</span></div>
    <div class="stat"><b>{now}</b><span>Now · milliseconds</span></div>
  </div>

  <div>
    <label class="lbl" for="ts-in">Unix timestamp to date</label>
    <div class="tk-row">
      <input id="ts-in" type="text" bind:value={tsInput} placeholder="1700000000" inputmode="numeric" style="flex:1;min-width:12rem" />
      <button class="opt" onclick={() => (tsInput = String(Math.floor(now / 1000)))}>Use now</button>
    </div>
    {#if parsed && 'error' in parsed}<p class="err" role="alert">{parsed.error}</p>
    {:else if parsed}<p class="muted" style="margin:.4rem 0">Read as {parsed.unit === 's' ? 'seconds' : parsed.unit === 'ms' ? 'milliseconds' : parsed.unit === 'µs' ? 'microseconds' : 'nanoseconds'}</p>
      {@render table(parsed.d)}{/if}
  </div>

  <div>
    <label class="lbl" for="dt-in">Date to Unix timestamp (your local time)</label>
    <input id="dt-in" type="datetime-local" step="1" bind:value={dtInput} />
    {#if fromDt}<div style="margin-top:.6rem">{@render table(fromDt)}</div>{/if}
  </div>
</div>
