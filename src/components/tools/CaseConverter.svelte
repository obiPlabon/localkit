<script lang="ts">
  import { converters } from '../../lib/tools/case';
  import { copyText } from '../../lib/tools/util';

  let text = $state('');
  let copied = $state(false);

  function apply(id: string) {
    text = converters.find((c) => c.id === id)!.fn(text);
  }
  async function copy() {
    copied = await copyText(text);
    setTimeout(() => (copied = false), 1200);
  }
</script>

<div class="tk">
  <textarea bind:value={text} spellcheck="false" placeholder="Type or paste text, then pick a case" style="min-height:12rem" aria-label="Text"></textarea>
  <div class="tk-row">
    {#each converters as c}<button class="opt" onclick={() => apply(c.id)} disabled={!text}>{c.label}</button>{/each}
  </div>
  <div class="tk-row">
    <button class="opt on" onclick={copy} disabled={!text}>{copied ? 'Copied' : 'Copy'}</button>
    <button class="opt" onclick={() => (text = '')} disabled={!text}>Clear</button>
  </div>
</div>
