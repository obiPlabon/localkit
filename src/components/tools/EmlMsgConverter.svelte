<script lang="ts">
  import { parseMailFile } from '../../lib/mail/client';
  import { buildEml } from '../../lib/mail/eml-build';
  import { buildMsg } from '../../lib/mail/msg-build';
  import { downloadBlob, formatBytes } from '../../lib/tools/util';
  import { makeZip, uniqueName } from '../../lib/tools/zip';

  type Item = { name: string; from: string; to: string; subject: string; attachments: number; before: number; out?: Blob; outName: string; error?: string };

  let items = $state<Item[]>([]);
  let dragging = $state(false);
  let busy = $state(false);
  let run = 0;

  async function convert(files: File[]) {
    const id = ++run;
    busy = true;
    const out: Item[] = [];
    for (const f of files) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      const it: Item = { name: f.name, from: '', to: '', subject: '', attachments: 0, before: f.size, outName: f.name };
      try {
        if (ext !== 'eml' && ext !== 'msg') throw new Error('Only .eml and .msg files can be converted.');
        const mail = await parseMailFile(f);
        const toMsg = mail.format === 'eml';
        const bytes = toMsg ? buildMsg(mail) : buildEml(mail);
        it.out = new Blob([bytes as BlobPart], { type: toMsg ? 'application/vnd.ms-outlook' : 'message/rfc822' });
        it.outName = f.name.replace(/\.[^.]+$/, '') + (toMsg ? '.msg' : '.eml');
        it.subject = mail.subject || '(no subject)';
        it.from = mail.from ? mail.from.name || mail.from.address : '';
        it.to = mail.to.map((a) => a.name || a.address).join(', ');
        it.attachments = mail.attachments.length;
      } catch (e) {
        it.error = e instanceof Error ? e.message : 'Could not convert this file.';
      }
      out.push(it);
      if (id !== run) return;
    }
    items = out;
    busy = false;
  }

  function add(list: FileList | null | undefined) {
    const files = [...(list ?? [])];
    if (files.length) convert(files);
  }

  async function saveAll() {
    const seen = new Set<string>();
    const entries = await Promise.all(items.filter((i) => i.out).map(async (i) => ({ name: uniqueName(i.outName, seen), data: new Uint8Array(await i.out!.arrayBuffer()) })));
    downloadBlob(makeZip(entries), 'converted-emails.zip');
  }
</script>

<div class="tk">
  <label
    class="dropzone" class:dragging
    ondragover={(e) => { e.preventDefault(); dragging = true; }}
    ondragleave={() => (dragging = false)}
    ondrop={(e) => { e.preventDefault(); dragging = false; add(e.dataTransfer?.files); }}
  >
    <input type="file" accept=".eml,.msg" multiple hidden onchange={(e) => { add(e.currentTarget.files); e.currentTarget.value = ''; }} />
    <strong>{busy ? 'Converting…' : 'Drop .eml or .msg files here'}</strong>
    <span>.eml becomes .msg, and .msg becomes .eml · several files at once</span>
    <small>🔒 Converted on your device. Nothing is uploaded.</small>
  </label>

  {#if items.length}
    <table class="kv">
      <tbody>
        {#each items as i}
          <tr>
            <td>
              <strong>{i.name}</strong> <span class="muted">→ {i.outName}</span>
              {#if i.error}<div class="err">{i.error}</div>
              {:else}
                <div class="muted">{i.subject}{i.from ? ` · from ${i.from}` : ''}{i.to ? ` · to ${i.to}` : ''}{i.attachments ? ` · ${i.attachments} attachment${i.attachments === 1 ? '' : 's'}` : ''}</div>
                <div class="muted">{formatBytes(i.before)} → {formatBytes(i.out!.size)}</div>
              {/if}
            </td>
            <td style="width:1%">{#if i.out}<button class="opt" onclick={() => downloadBlob(i.out!, i.outName)}>Save</button>{/if}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if items.filter((i) => i.out).length > 1}<div><button class="opt on" onclick={saveAll}>Save all as ZIP</button></div>{/if}
  {/if}

  <p class="muted">Subject, sender, recipients, dates, text and HTML bodies, inline images and attachments are carried over. Delivery headers are kept so they can still be inspected.</p>
</div>
