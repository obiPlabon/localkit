<script lang="ts">
  let pattern = $state('(\\w+)@(\\w+)\\.com');
  let flags = $state('g');
  let text = $state('hello@example.com, bob@site.com');

  const flagList = [['g', 'global'], ['i', 'ignore case'], ['m', 'multiline'], ['s', 'dotAll'], ['u', 'unicode']];
  function toggle(f: string) { flags = flags.includes(f) ? flags.replace(f, '') : flags + f; }

  const res = $derived.by(() => {
    if (!pattern) return { matches: [] as RegExpMatchArray[], error: '', parts: [] as { t: string; hit: boolean }[] };
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      const matches: RegExpMatchArray[] = [];
      for (const m of text.matchAll(re)) {
        matches.push(m);
        if (matches.length >= 1000) break;
      }
      const parts: { t: string; hit: boolean }[] = [];
      let last = 0;
      for (const m of matches) {
        if (m[0] === '') continue;
        parts.push({ t: text.slice(last, m.index), hit: false }, { t: m[0], hit: true });
        last = m.index! + m[0].length;
      }
      parts.push({ t: text.slice(last), hit: false });
      return { matches, error: '', parts };
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : 'Invalid pattern.', parts: [] };
    }
  });
</script>

<div class="tk">
  <div>
    <label class="lbl" for="re-p">Pattern</label>
    <input id="re-p" type="text" bind:value={pattern} spellcheck="false" style="font-family:var(--font-mono)" />
  </div>
  <div class="tk-row">
    {#each flagList as [f, name]}
      <button class="opt" class:on={flags.includes(f)} onclick={() => toggle(f)} title={name}>{f} <span style="opacity:.7">{name}</span></button>
    {/each}
  </div>
  {#if res.error}<p class="err" role="alert">{res.error}</p>{/if}
  <div>
    <label class="lbl" for="re-t">Test string</label>
    <textarea id="re-t" bind:value={text} spellcheck="false"></textarea>
  </div>
  {#if !res.error}
    <div>
      <span class="lbl">{res.matches.length} match{res.matches.length === 1 ? '' : 'es'}</span>
      <pre>{#each res.parts as p}{#if p.hit}<mark>{p.t}</mark>{:else}{p.t}{/if}{/each}</pre>
    </div>
    {#if res.matches.length}
      <table class="kv">
        <tbody>
          {#each res.matches.slice(0, 100) as m, i}
            <tr>
              <th>#{i + 1} @{m.index}</th>
              <td class="mono-out">{m[0]}
                {#each m.slice(1) as g, gi}<div class="muted">${gi + 1}: {g ?? 'undefined'}</div>{/each}
                {#if m.groups}{#each Object.entries(m.groups) as [k, v]}<div class="muted">{k}: {v ?? 'undefined'}</div>{/each}{/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}
</div>

<style>
  mark { background: var(--accent-soft); color: var(--accent); outline: 1px solid var(--accent); }
</style>
