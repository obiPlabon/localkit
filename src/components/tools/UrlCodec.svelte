<script lang="ts">
  import { copyText } from '../../lib/tools/util';

  let mode = $state<'encode' | 'decode'>('encode');
  let scope = $state<'component' | 'full'>('component');
  let input = $state('');
  let copied = $state(false);

  const result = $derived.by(() => {
    if (!input) return { out: '', err: '' };
    try {
      if (mode === 'encode') return { out: scope === 'component' ? encodeURIComponent(input) : encodeURI(input), err: '' };
      // "+" is a space in form-encoded query strings
      const s = input.replace(/\+/g, ' ');
      return { out: scope === 'component' ? decodeURIComponent(s) : decodeURI(s), err: '' };
    } catch {
      return { out: '', err: 'Malformed input: contains an invalid % escape sequence.' };
    }
  });

  const parsed = $derived.by(() => {
    try {
      const u = new URL(input.trim());
      return { u, params: [...u.searchParams.entries()] };
    } catch {
      return null;
    }
  });

  async function copy(t: string) {
    copied = await copyText(t);
    setTimeout(() => (copied = false), 1200);
  }
</script>

<div class="tk">
  <div class="tk-row">
    <button class="opt" class:on={mode === 'encode'} onclick={() => (mode = 'encode')}>Encode</button>
    <button class="opt" class:on={mode === 'decode'} onclick={() => (mode = 'decode')}>Decode</button>
    <select bind:value={scope} aria-label="Scope" style="width:auto">
      <option value="component">Component (encodeURIComponent)</option>
      <option value="full">Full URL (encodeURI)</option>
    </select>
  </div>
  <div class="tk-grid2">
    <div>
      <label class="lbl" for="url-in">{mode === 'encode' ? 'Text or URL' : 'Encoded text'}</label>
      <textarea id="url-in" bind:value={input} spellcheck="false" placeholder={mode === 'encode' ? 'Type or paste text' : 'Paste a percent-encoded string'}></textarea>
    </div>
    <div>
      <div class="tk-row between"><span class="lbl">Result</span>
        {#if result.out}<button class="opt" onclick={() => copy(result.out)}>{copied ? 'Copied' : 'Copy'}</button>{/if}</div>
      <textarea class="out" readonly value={result.out} spellcheck="false"></textarea>
    </div>
  </div>
  {#if result.err}<p class="err" role="alert">{result.err}</p>{/if}

  {#if parsed}
    <div>
      <span class="lbl">URL breakdown</span>
      <table class="kv">
        <tbody>
          <tr><th>Protocol</th><td>{parsed.u.protocol}</td></tr>
          <tr><th>Host</th><td>{parsed.u.host}</td></tr>
          <tr><th>Path</th><td>{parsed.u.pathname}</td></tr>
          {#if parsed.u.hash}<tr><th>Fragment</th><td>{parsed.u.hash}</td></tr>{/if}
          {#each parsed.params as [k, v]}
            <tr><th>?{k}</th><td>{v}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
