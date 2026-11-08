<script lang="ts">
  import { buildSignature, fonts, type SigOptions } from '../../lib/tools/signature';
  import { copyText } from '../../lib/tools/util';

  let o = $state<SigOptions>({
    name: 'Ada Lovelace', title: 'Chief Analyst', company: 'Analytical Engines Ltd',
    phone: '+44 20 7946 0000', mobile: '', email: 'ada@example.com', website: 'example.com', address: '',
    photo: '', round: true, linkedin: '', x: '', github: '', instagram: '',
    layout: 'classic', color: '#1a1af0', font: 'Arial', size: 13,
  });
  let copied = $state('');
  let note = $state('');

  const html = $derived(buildSignature(o));
  const plain = $derived(
    [o.name, [o.title, o.company].filter(Boolean).join(' | '), o.phone && `T ${o.phone}`, o.mobile && `M ${o.mobile}`, o.email && `E ${o.email}`, o.website && `W ${o.website}`, o.address].filter(Boolean).join('\n'),
  );

  const fields: [keyof SigOptions, string, string?][] = [
    ['name', 'Full name'], ['title', 'Job title'], ['company', 'Company'], ['email', 'Email', 'email'],
    ['phone', 'Phone', 'tel'], ['mobile', 'Mobile', 'tel'], ['website', 'Website'], ['address', 'Address'],
  ];
  const socials: [keyof SigOptions, string][] = [['linkedin', 'LinkedIn URL'], ['x', 'X (Twitter) URL'], ['github', 'GitHub URL'], ['instagram', 'Instagram URL']];

  async function copyRich() {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([plain], { type: 'text/plain' }) })]);
      flash('rich');
    } catch {
      // Older browsers: fall back to copying the HTML source
      if (await copyText(html)) flash('html');
    }
  }
  async function copySource() { if (await copyText(html)) flash('html'); }
  function flash(k: string) { copied = k; setTimeout(() => (copied = ''), 1500); }

  /** Shrinks an uploaded photo to a small square JPEG so the signature stays light. */
  async function onPhoto(f: File | undefined) {
    if (!f) return;
    note = '';
    try {
      const bmp = await createImageBitmap(f);
      const s = Math.min(bmp.width, bmp.height);
      const c = document.createElement('canvas');
      c.width = c.height = 176;
      c.getContext('2d')!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 176, 176);
      bmp.close();
      o.photo = c.toDataURL('image/jpeg', 0.85);
      note = 'Photo embedded in the signature. Gmail and some other clients do not show embedded images. For those, upload the photo somewhere public and paste its link instead.';
    } catch {
      note = 'Could not read that image.';
    }
  }
</script>

<div class="tk">
  <div class="tk-grid2">
    <div class="form">
      <div class="tk-row">
        {#each [['classic', 'Classic'], ['stacked', 'Stacked'], ['compact', 'Compact']] as [id, label]}
          <button class="opt" class:on={o.layout === id} onclick={() => (o.layout = id as SigOptions['layout'])}>{label}</button>
        {/each}
      </div>

      {#each fields as [key, label, type]}
        <div>
          <label class="lbl" for={`sg-${key}`}>{label}</label>
          <input id={`sg-${key}`} type={type ?? 'text'} bind:value={o[key] as string} autocomplete="off" />
        </div>
      {/each}

      <div>
        <label class="lbl" for="sg-photo">Photo or logo URL</label>
        <input id="sg-photo" type="text" bind:value={o.photo} placeholder="https://…/photo.jpg" autocomplete="off" />
        <div class="tk-row" style="margin-top:.5rem">
          <label class="opt" style="cursor:pointer">Upload<input type="file" accept="image/*" hidden onchange={(e) => onPhoto(e.currentTarget.files?.[0])} /></label>
          {#if o.photo}<button class="opt" onclick={() => (o.photo = '')}>Remove</button>{/if}
          <label class="check"><input type="checkbox" bind:checked={o.round} /> Round</label>
        </div>
        {#if note}<p class="muted" style="margin-top:.4rem">{note}</p>{/if}
      </div>

      {#each socials as [key, label]}
        <div>
          <label class="lbl" for={`sg-${key}`}>{label}</label>
          <input id={`sg-${key}`} type="text" bind:value={o[key] as string} placeholder="https://" autocomplete="off" />
        </div>
      {/each}

      <div class="tk-row">
        <label class="check">Color <input type="color" bind:value={o.color} class="swatch" aria-label="Accent color" /></label>
        <label class="check">Font
          <select bind:value={o.font}>{#each Object.keys(fonts) as f}<option>{f}</option>{/each}</select></label>
        <label class="check">Size {o.size}px <input type="range" min="11" max="16" bind:value={o.size} /></label>
      </div>
    </div>

    <div class="out-col">
      <span class="lbl">Preview</span>
      <div class="preview">{@html html}</div>
      <div class="tk-row">
        <button class="opt on" onclick={copyRich}>{copied === 'rich' ? 'Copied' : 'Copy signature'}</button>
        <button class="opt" onclick={copySource}>{copied === 'html' ? 'Copied' : 'Copy HTML'}</button>
      </div>
      <p class="muted">Paste it straight into your mail app’s signature box. If a client strips the formatting, use the HTML in its “edit HTML signature” option.</p>
      <details>
        <summary class="lbl" style="cursor:pointer">HTML source</summary>
        <textarea class="out" readonly value={html} spellcheck="false" style="min-height:9rem"></textarea>
      </details>
    </div>
  </div>
</div>

<style>
  .form { display: grid; gap: var(--s-3); align-content: start; }
  .out-col { display: grid; gap: var(--s-3); align-content: start; min-width: 0; }
  /* The preview is always light: signatures are sent on white backgrounds. */
  .preview { background: #fff; border: 1px solid var(--border-strong); padding: var(--s-4); overflow: auto; min-height: 9rem; color: #333; }
  .swatch { width: 2.2rem; height: 2rem; padding: 0; border: 1px solid var(--border-strong); background: none; cursor: pointer; }
</style>
