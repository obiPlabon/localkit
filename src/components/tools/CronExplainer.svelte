<script lang="ts">
  import { parseCron, describeCron, nextRuns } from '../../lib/tools/cron';

  let expr = $state('*/15 9-17 * * 1-5');
  const presets = [
    ['Every minute', '* * * * *'],
    ['Every 5 min', '*/5 * * * *'],
    ['Hourly', '0 * * * *'],
    ['Daily 09:00', '0 9 * * *'],
    ['Weekdays 09:00', '0 9 * * 1-5'],
    ['Weekly (Mon)', '0 0 * * 1'],
    ['Monthly', '0 0 1 * *'],
    ['Yearly', '0 0 1 1 *'],
  ];
  const fields = ['Minute', 'Hour', 'Day of month', 'Month', 'Day of week'];

  const result = $derived.by(() => {
    try {
      const p = parseCron(expr);
      const runs = nextRuns(p, new Date(), 8);
      return { p, text: describeCron(p), runs, err: '' };
    } catch (e) {
      return { p: null, text: '', runs: [] as Date[], err: e instanceof Error ? e.message : 'Invalid expression.' };
    }
  });

  const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
</script>

<div class="tk">
  <div>
    <label class="lbl" for="cron-in">Cron expression</label>
    <input id="cron-in" type="text" bind:value={expr} spellcheck="false" autocomplete="off" style="font-family:var(--font-mono)" />
  </div>
  <div class="tk-row">
    {#each presets as [label, val]}
      <button class="opt" class:on={expr === val} onclick={() => (expr = val)}>{label}</button>
    {/each}
  </div>

  {#if result.err}
    <p class="err" role="alert">{result.err}</p>
  {:else if result.p}
    <p style="font:450 var(--text-xl)/1.25 var(--font-display);color:var(--heading)">{result.text}.</p>
    <table class="kv">
      <tbody>
        {#each fields as f, i}
          <tr><th>{f}</th><td class="mono-out">{result.p.raw[i]}</td></tr>
        {/each}
      </tbody>
    </table>
    <div>
      <span class="lbl">Next runs (your local time)</span>
      {#if result.runs.length}
        <ol class="runs">
          {#each result.runs as d}<li>{fmt.format(d)}</li>{/each}
        </ol>
      {:else}
        <p class="muted">This schedule never fires in the next 8 years (for example 31 February).</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .runs { margin: 0; padding-left: 1.4rem; display: grid; gap: .2rem; font: 400 .9rem/1.5 var(--font-mono); }
</style>
