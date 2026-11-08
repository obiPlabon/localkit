<script lang="ts">
  import { allZones, localZone, offsetMinutes, wallToUtc, formatOffset, isoDate } from '../../lib/tools/tz';

  const zones = allZones();
  const here = localZone();
  const pad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();

  let date = $state(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
  let time = $state(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  let source = $state(here);
  let targets = $state<string[]>([...new Set(['UTC', 'America/New_York', 'Europe/London', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Tokyo', 'Australia/Sydney'].filter((z) => z !== here && zones.includes(z)))]);
  let adding = $state('');
  let use24 = $state(true);

  const instant = $derived.by(() => {
    const d = date.match(/^(\d{4})-(\d{2})-(\d{2})$/), t = time.match(/^(\d{2}):(\d{2})/);
    if (!d || !t || !zones.includes(source)) return null;
    return wallToUtc(+d[1], +d[2], +d[3], +t[1], +t[2], source);
  });

  function show(ms: number, tz: string) {
    const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, { timeZone: tz, ...o }).format(new Date(ms));
    const off = offsetMinutes(ms, tz);
    return {
      time: f({ hour: '2-digit', minute: '2-digit', hour12: !use24 }),
      day: f({ weekday: 'short', month: 'short', day: 'numeric' }),
      abbr: f({ timeZoneName: 'short' }).split(' ').pop(),
      off, offText: formatOffset(off),
    };
  }

  const rows = $derived.by(() => {
    if (instant === null) return [];
    const base = offsetMinutes(instant, source);
    return [source, ...targets.filter((z) => z !== source)].map((tz, i) => {
      const s = show(instant, tz);
      const diff = s.off - base;
      const dayShift = isoDate(instant, tz) === isoDate(instant, source) ? '' : isoDate(instant, tz) > isoDate(instant, source) ? '+1 day' : '−1 day';
      return { tz, i, ...s, diff, dayShift };
    });
  });

  function addZone() {
    const z = adding.trim();
    if (zones.includes(z) && z !== source && !targets.includes(z)) { targets = [...targets, z]; adding = ''; }
  }
  const useNow = () => {
    const n = new Date();
    date = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
    time = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
    source = here;
  };
  const diffText = (m: number) => (m === 0 ? 'same time' : `${m > 0 ? '+' : '−'}${Math.floor(Math.abs(m) / 60)}h${Math.abs(m) % 60 ? ` ${Math.abs(m) % 60}m` : ''}`);
</script>

<div class="tk">
  <div class="tk-row">
    <div><label class="lbl" for="tz-d">Date</label><input id="tz-d" type="date" bind:value={date} /></div>
    <div><label class="lbl" for="tz-t">Time</label><input id="tz-t" type="time" bind:value={time} /></div>
    <div style="flex:1;min-width:14rem">
      <label class="lbl" for="tz-s">Time zone</label>
      <select id="tz-s" bind:value={source} style="width:100%">
        {#each zones as z}<option value={z}>{z.replace(/_/g, ' ')}</option>{/each}
      </select>
    </div>
  </div>
  <div class="tk-row">
    <button class="opt" onclick={useNow}>Now</button>
    <label class="check"><input type="checkbox" bind:checked={use24} /> 24-hour clock</label>
  </div>

  {#if instant === null}
    <p class="err" role="alert">Pick a valid date, time and time zone.</p>
  {:else}
    <table class="kv">
      <tbody>
        {#each rows as r}
          <tr class:self={r.i === 0}>
            <th>{r.tz.replace(/_/g, ' ')}{#if r.i === 0}<div class="muted">source</div>{/if}</th>
            <td>
              <strong class="big">{r.time}</strong> <span class="muted">{r.day}{r.dayShift ? ` (${r.dayShift})` : ''}</span>
              <div class="muted">{r.abbr} · {r.offText}{r.i ? ` · ${diffText(r.diff)}` : ''}</div>
            </td>
            <td style="width:1%">{#if r.i}<button class="opt" onclick={() => (targets = targets.filter((z) => z !== r.tz))} aria-label={`Remove ${r.tz}`}>✕</button>{/if}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <div class="tk-row">
    <input type="text" list="tz-list" bind:value={adding} placeholder="Add a zone, e.g. Europe/Paris" aria-label="Add a time zone" style="flex:1;min-width:14rem" onkeydown={(e) => e.key === 'Enter' && addZone()} onchange={addZone} />
    <datalist id="tz-list">{#each zones as z}<option value={z}></option>{/each}</datalist>
    <button class="opt" onclick={addZone}>Add</button>
  </div>
</div>

<style>
  .big { font: 450 1.4rem/1.2 var(--font-display); color: var(--heading); }
  tr.self { background: var(--accent-soft); }
  tr.self th, tr.self td { padding-inline: .5rem; }
</style>
