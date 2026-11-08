<script lang="ts">
  import { copyText, formatBytes } from '../../lib/tools/util';

  let mode = $state<'encode' | 'decode'>('encode');
  let urlSafe = $state(false);
  let input = $state('');
  let fileInfo = $state('');
  let fileOut = $state('');
  let copied = $state(false);

  function bytesToB64(bytes: Uint8Array): string {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }

  const result = $derived.by(() => {
    if (!input) return { out: '', err: '' };
    try {
      if (mode === 'encode') {
        let b = bytesToB64(new TextEncoder().encode(input));
        if (urlSafe) b = b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return { out: b, err: '' };
      }
      let s = input.trim().replace(/^data:[^,]*,/, '').replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
      while (s.length % 4) s += '=';
      const bin = atob(s);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return { out: new TextDecoder('utf-8', { fatal: true }).decode(bytes), err: '' };
    } catch {
      return { out: '', err: mode === 'decode' ? 'Not valid Base64 (or not UTF-8 text).' : 'Could not encode this text.' };
    }
  });

  async function onFile(f: File | undefined) {
    if (!f) return;
    const bytes = new Uint8Array(await f.arrayBuffer());
    fileInfo = `${f.name} · ${formatBytes(f.size)}`;
    fileOut = `data:${f.type || 'application/octet-stream'};base64,${bytesToB64(bytes)}`;
  }

  async function copy(t: string) {
    copied = await copyText(t);
    setTimeout(() => (copied = false), 1200);
  }
</script>

<div class="tk">
  <div class="tk-row">
    <button class="opt" class:on={mode === 'encode'} onclick={() => (mode = 'encode')}>Encode</button>
    <button class="opt" class:on={mode === 'decode'} onclick={() => (mode = 'decode')}>Decode</button>
    {#if mode === 'encode'}<label class="check"><input type="checkbox" bind:checked={urlSafe} /> URL-safe</label>{/if}
  </div>
  <div class="tk-grid2">
    <div>
      <label class="lbl" for="b64-in">{mode === 'encode' ? 'Text' : 'Base64'}</label>
      <textarea id="b64-in" bind:value={input} spellcheck="false" placeholder={mode === 'encode' ? 'Type or paste text' : 'Paste Base64'}></textarea>
    </div>
    <div>
      <div class="tk-row between"><span class="lbl">{mode === 'encode' ? 'Base64' : 'Text'}</span>
        {#if result.out}<button class="opt" onclick={() => copy(result.out)}>{copied ? 'Copied' : 'Copy'}</button>{/if}</div>
      <textarea class="out" readonly value={result.out} spellcheck="false"></textarea>
    </div>
  </div>
  {#if result.err}<p class="err" role="alert">{result.err}</p>{/if}

  <div>
    <span class="lbl">Encode a file as a data URI</span>
    <input type="file" onchange={(e) => onFile(e.currentTarget.files?.[0])} />
    {#if fileOut}
      <p class="muted" style="margin-top:.5rem">{fileInfo}</p>
      <textarea class="out" readonly value={fileOut} style="min-height:6rem"></textarea>
      <button class="opt" onclick={() => copy(fileOut)} style="margin-top:.5rem">Copy data URI</button>
    {/if}
  </div>
</div>
