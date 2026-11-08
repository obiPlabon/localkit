<script lang="ts">
  import { md5 } from '../../lib/tools/md5';
  import { toHex, copyText, formatBytes } from '../../lib/tools/util';

  const algos = [
    { id: 'MD5', note: 'legacy' },
    { id: 'SHA-1', note: 'legacy' },
    { id: 'SHA-256', note: '' },
    { id: 'SHA-384', note: '' },
    { id: 'SHA-512', note: '' },
  ];

  let text = $state('');
  let hashes = $state<Record<string, string>>({});
  let source = $state('');
  let upper = $state(false);
  let busy = $state(false);
  let copiedId = $state('');

  async function compute(bytes: Uint8Array) {
    busy = true;
    const out: Record<string, string> = { MD5: toHex(md5(bytes)) };
    for (const a of algos.slice(1)) out[a.id] = toHex(await crypto.subtle.digest(a.id, bytes as BufferSource));
    hashes = out;
    busy = false;
  }

  $effect(() => {
    if (source === 'file') return;
    const t = text;
    if (!t) { hashes = {}; return; }
    compute(new TextEncoder().encode(t));
  });

  async function onFile(f: File | undefined) {
    if (!f) return;
    source = 'file';
    text = '';
    await compute(new Uint8Array(await f.arrayBuffer()));
    source = `file:${f.name} · ${formatBytes(f.size)}`;
  }

  async function copy(id: string) {
    if (await copyText(show(hashes[id]))) { copiedId = id; setTimeout(() => (copiedId = ''), 1200); }
  }
  const show = (h: string) => (upper ? h.toUpperCase() : h);
</script>

<div class="tk">
  <div>
    <label class="lbl" for="h-in">Text</label>
    <textarea id="h-in" bind:value={text} oninput={() => (source = '')} spellcheck="false" placeholder="Type or paste text" style="min-height:7rem"></textarea>
  </div>
  <div>
    <span class="lbl">Or hash a file</span>
    <input type="file" onchange={(e) => onFile(e.currentTarget.files?.[0])} />
    {#if source.startsWith('file:')}<p class="muted" style="margin-top:.4rem">{source.slice(5)}</p>{/if}
  </div>
  <label class="check"><input type="checkbox" bind:checked={upper} /> Uppercase</label>
  {#if Object.keys(hashes).length}
    <table class="kv">
      <tbody>
        {#each algos as a}
          <tr>
            <th>{a.id}{#if a.note}<div class="muted">{a.note}</div>{/if}</th>
            <td class="mono-out">{show(hashes[a.id])}</td>
            <td style="width:1%"><button class="opt" onclick={() => copy(a.id)}>{copiedId === a.id ? 'Copied' : 'Copy'}</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else if busy}<p class="muted">Hashing…</p>{/if}
</div>
