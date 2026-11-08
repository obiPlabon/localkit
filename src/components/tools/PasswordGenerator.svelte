<script lang="ts">
  import { copyText } from '../../lib/tools/util';

  let length = $state(20);
  let lower = $state(true);
  let upper = $state(true);
  let digits = $state(true);
  let symbols = $state(true);
  let noAmbiguous = $state(false);
  let count = $state(1);
  let passwords = $state<string[]>([]);
  let copied = $state(-1);

  const AMBIG = /[Il1O0o]/g;
  function pool(): string {
    let p = '';
    if (lower) p += 'abcdefghijklmnopqrstuvwxyz';
    if (upper) p += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (digits) p += '0123456789';
    if (symbols) p += '!@#$%^&*()-_=+[]{};:,.?/~';
    return noAmbiguous ? p.replace(AMBIG, '') : p;
  }
  /** Unbiased random int in [0, n) via rejection sampling. */
  function rnd(n: number): number {
    const lim = Math.floor(2 ** 32 / n) * n;
    const b = new Uint32Array(1);
    do crypto.getRandomValues(b); while (b[0] >= lim);
    return b[0] % n;
  }
  function make(): string {
    const p = pool();
    let out = '';
    for (let i = 0; i < length; i++) out += p[rnd(p.length)];
    return out;
  }
  function generate() {
    passwords = pool() ? Array.from({ length: count }, make) : [];
  }
  $effect(() => { length; lower; upper; digits; symbols; noAmbiguous; count; generate(); });

  const entropy = $derived(Math.round(length * Math.log2(Math.max(pool().length, 1))));
  const strength = $derived(entropy < 50 ? 'Weak' : entropy < 80 ? 'Fair' : entropy < 110 ? 'Strong' : 'Very strong');

  async function copy(i: number) {
    if (await copyText(passwords[i])) { copied = i; setTimeout(() => (copied = -1), 1200); }
  }
</script>

<div class="tk">
  <div>
    <label class="lbl" for="pw-len">Length: {length}</label>
    <input id="pw-len" type="range" min="6" max="128" bind:value={length} style="width:100%" />
  </div>
  <div class="tk-row">
    <label class="check"><input type="checkbox" bind:checked={lower} /> a–z</label>
    <label class="check"><input type="checkbox" bind:checked={upper} /> A–Z</label>
    <label class="check"><input type="checkbox" bind:checked={digits} /> 0–9</label>
    <label class="check"><input type="checkbox" bind:checked={symbols} /> Symbols</label>
    <label class="check"><input type="checkbox" bind:checked={noAmbiguous} /> No look-alikes (Il1O0)</label>
  </div>
  <div class="tk-row">
    <label class="check">How many <select bind:value={count} style="width:auto"><option>1</option><option>5</option><option>10</option></select></label>
    <button class="opt on" onclick={generate}>Regenerate</button>
  </div>
  {#if passwords.length}
    <p class="muted">{strength} · about {entropy} bits of entropy</p>
    <div class="tk">
      {#each passwords as p, i}
        <div class="tk-row between" style="border:1px solid var(--border);padding:.6rem .75rem;background:var(--surface-2)">
          <span class="mono-out" style="flex:1">{p}</span>
          <button class="opt" onclick={() => copy(i)}>{copied === i ? 'Copied' : 'Copy'}</button>
        </div>
      {/each}
    </div>
  {:else}<p class="err">Select at least one character type.</p>{/if}
</div>
