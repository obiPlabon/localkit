<script lang="ts">
  import { generate, type Unit } from '../../lib/tools/lorem';
  import { copyText } from '../../lib/tools/util';

  let unit = $state<Unit>('paragraphs');
  let count = $state(3);
  let classic = $state(true);
  let seed = $state(0);
  let copied = $state(false);

  const text = $derived.by(() => {
    seed;
    return generate(unit, Math.floor(count) || 1, classic);
  });

  async function copy() {
    copied = await copyText(text);
    setTimeout(() => (copied = false), 1200);
  }
</script>

<div class="tk">
  <div class="tk-row">
    {#each ['paragraphs', 'sentences', 'words'] as u}
      <button class="opt" class:on={unit === u} onclick={() => (unit = u as Unit)}>{u}</button>
    {/each}
    <label class="check">Count <input type="number" min="1" max="1000" bind:value={count} style="width:5.5rem" /></label>
    <label class="check"><input type="checkbox" bind:checked={classic} /> Start with “Lorem ipsum”</label>
    <button class="opt" onclick={() => seed++}>Regenerate</button>
    <button class="opt" onclick={copy}>{copied ? 'Copied' : 'Copy'}</button>
  </div>
  <textarea class="out" readonly value={text} spellcheck="false" style="min-height:18rem;font-family:var(--font-sans)"></textarea>
</div>
