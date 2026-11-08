<script lang="ts">
  import { copyText, toHex } from '../../lib/tools/util';

  type Kind = 'v4' | 'v7' | 'ulid' | 'nil';
  let kind = $state<Kind>('v4');
  let count = $state(5);
  let upper = $state(false);
  let hyphens = $state(true);
  let seed = $state(0);
  let copied = $state(false);

  function v7(): string {
    const b = crypto.getRandomValues(new Uint8Array(16));
    const ts = BigInt(Date.now());
    for (let i = 0; i < 6; i++) b[i] = Number((ts >> BigInt(8 * (5 - i))) & 0xffn);
    b[6] = (b[6] & 0x0f) | 0x70;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = toHex(b);
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function ulid(): string {
    let t = Date.now();
    let time = '';
    for (let i = 0; i < 10; i++) { time = CROCKFORD[t % 32] + time; t = Math.floor(t / 32); }
    const r = crypto.getRandomValues(new Uint8Array(16));
    let rand = '';
    for (let i = 0; i < 16; i++) rand += CROCKFORD[r[i] % 32];
    return time + rand;
  }

  const ids = $derived.by(() => {
    seed; // regenerate on demand
    const n = Math.max(1, Math.min(Math.floor(count) || 1, 1000));
    return Array.from({ length: n }, () => {
      let s = kind === 'v4' ? crypto.randomUUID() : kind === 'v7' ? v7() : kind === 'ulid' ? ulid() : '00000000-0000-0000-0000-000000000000';
      if (kind !== 'ulid' && !hyphens) s = s.replace(/-/g, '');
      return kind === 'ulid' ? (upper ? s : s.toLowerCase()) : upper ? s.toUpperCase() : s;
    });
  });

  async function copyAll() {
    copied = await copyText(ids.join('\n'));
    setTimeout(() => (copied = false), 1200);
  }
</script>

<div class="tk">
  <div class="tk-row">
    {#each [['v4', 'UUID v4'], ['v7', 'UUID v7'], ['ulid', 'ULID'], ['nil', 'Nil']] as [k, label]}
      <button class="opt" class:on={kind === k} onclick={() => (kind = k as Kind)}>{label}</button>
    {/each}
  </div>
  <div class="tk-row">
    <label class="check">Count <input type="number" min="1" max="1000" bind:value={count} style="width:5.5rem" /></label>
    <label class="check"><input type="checkbox" bind:checked={upper} /> Uppercase</label>
    {#if kind !== 'ulid'}<label class="check"><input type="checkbox" bind:checked={hyphens} /> Hyphens</label>{/if}
    <button class="opt" onclick={() => seed++}>Regenerate</button>
    <button class="opt" onclick={copyAll}>{copied ? 'Copied' : 'Copy all'}</button>
  </div>
  <textarea class="out" readonly value={ids.join('\n')} spellcheck="false" style="min-height:14rem"></textarea>
  <p class="muted">
    {#if kind === 'v4'}Random 122-bit identifier. The default choice.
    {:else if kind === 'v7'}Time-ordered: the first 48 bits are a millisecond timestamp, so IDs sort by creation time and index well in databases.
    {:else if kind === 'ulid'}26 characters, Crockford Base32, sortable by time.
    {:else}The all-zero UUID, used as a placeholder.{/if}
  </p>
</div>
