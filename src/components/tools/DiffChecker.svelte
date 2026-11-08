<script lang="ts">
  import { diffLines } from '../../lib/tools/diff';

  let left = $state('');
  let right = $state('');
  let ignoreWs = $state(false);

  const norm = (s: string) => (ignoreWs ? s.replace(/\s+/g, ' ').trim() : s);
  const ops = $derived.by(() => {
    if (!left && !right) return [];
    const a = left.split('\n'), b = right.split('\n');
    if (!ignoreWs) return diffLines(a, b);
    // Compare normalised, but display the right-hand original where lines match.
    const na = a.map(norm), nb = b.map(norm);
    const d = diffLines(na, nb);
    let ia = 0, ib = 0;
    return d.map((o) => {
      if (o.type === 'del') return { ...o, text: a[ia++] };
      if (o.type === 'add') return { ...o, text: b[ib++] };
      ia++;
      return { ...o, text: b[ib++] };
    });
  });
  const stats = $derived({ add: ops.filter((o) => o.type === 'add').length, del: ops.filter((o) => o.type === 'del').length });
  const mark = { same: ' ', add: '+', del: '−' };
</script>

<div class="tk">
  <div class="tk-grid2">
    <div><label class="lbl" for="d-a">Original</label><textarea id="d-a" bind:value={left} spellcheck="false" placeholder="Paste original text"></textarea></div>
    <div><label class="lbl" for="d-b">Changed</label><textarea id="d-b" bind:value={right} spellcheck="false" placeholder="Paste changed text"></textarea></div>
  </div>
  <div class="tk-row">
    <label class="check"><input type="checkbox" bind:checked={ignoreWs} /> Ignore whitespace</label>
    <button class="opt" onclick={() => { const t = left; left = right; right = t; }}>Swap</button>
    <button class="opt" onclick={() => { left = ''; right = ''; }}>Clear</button>
  </div>
  {#if ops.length}
    <p class="muted"><span class="ok">+{stats.add} added</span> · <span class="err">−{stats.del} removed</span>
      {#if !stats.add && !stats.del} · texts are identical{/if}</p>
    <div class="diff" role="table" aria-label="Differences">
      {#each ops as o}
        <div class="line {o.type}"><span class="m">{mark[o.type]}</span><span class="t">{o.text || ' '}</span></div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .diff { border: 1px solid var(--border); font: 400 .82rem/1.5 var(--font-mono); max-height: 32rem; overflow: auto; }
  .line { display: flex; gap: .6rem; padding: 0 .6rem; }
  .m { flex: none; width: 1ch; opacity: .7; user-select: none; }
  .t { white-space: pre-wrap; overflow-wrap: anywhere; }
  .add { background: color-mix(in srgb, #1a9d4a 18%, transparent); }
  .del { background: color-mix(in srgb, var(--danger) 16%, transparent); }
</style>
