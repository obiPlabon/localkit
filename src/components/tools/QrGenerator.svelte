<script lang="ts">
  import qrcode from 'qrcode-generator';
  import { downloadBlob } from '../../lib/tools/util';

  let kind = $state<'text' | 'wifi'>('text');
  let text = $state('https://example.com');
  let ssid = $state('');
  let pass = $state('');
  let sec = $state<'WPA' | 'WEP' | 'nopass'>('WPA');
  let ecl = $state<'L' | 'M' | 'Q' | 'H'>('M');
  let fg = $state('#000000');
  let bg = $state('#ffffff');
  let size = $state(320);

  const esc = (s: string) => s.replace(/([\;,:"])/g, '\\$1');
  const data = $derived(kind === 'text' ? text : ssid ? `WIFI:T:${sec};S:${esc(ssid)};${sec === 'nopass' ? '' : `P:${esc(pass)};`};` : '');

  const qr = $derived.by(() => {
    if (!data) return null;
    try {
      const q = qrcode(0, ecl);
      q.addData(data, 'Byte');
      q.make();
      return q;
    } catch {
      return null;
    }
  });

  const svg = $derived.by(() => {
    if (!qr) return '';
    const n = qr.getModuleCount(), m = 4;
    let d = '';
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + m},${r + m}h1v1h-1z`;
    const dim = n + m * 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${dim}" height="${dim}" fill="${bg}"/><path d="${d}" fill="${fg}"/></svg>`;
  });

  const tooLong = $derived(!!data && !qr);

  function saveSvg() { downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'qr-code.svg'); }
  function savePng() {
    const img = new Image();
    img.onload = () => {
      const px = Math.max(size, 512);
      const c = document.createElement('canvas');
      c.width = c.height = px;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, px, px);
      c.toBlob((b) => b && downloadBlob(b, 'qr-code.png'));
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
</script>

<div class="tk">
  <div class="tk-row">
    <button class="opt" class:on={kind === 'text'} onclick={() => (kind = 'text')}>Text / URL</button>
    <button class="opt" class:on={kind === 'wifi'} onclick={() => (kind = 'wifi')}>Wi-Fi</button>
  </div>
  <div class="tk-grid2">
    <div class="tk">
      {#if kind === 'text'}
        <div><label class="lbl" for="qr-t">Content</label><textarea id="qr-t" bind:value={text} style="min-height:7rem" spellcheck="false"></textarea></div>
      {:else}
        <div><label class="lbl" for="qr-s">Network name</label><input id="qr-s" type="text" bind:value={ssid} /></div>
        <div><label class="lbl" for="qr-p">Password</label><input id="qr-p" type="text" bind:value={pass} disabled={sec === 'nopass'} /></div>
        <div><label class="lbl" for="qr-sec">Security</label>
          <select id="qr-sec" bind:value={sec}><option value="WPA">WPA/WPA2/WPA3</option><option value="WEP">WEP</option><option value="nopass">None</option></select></div>
      {/if}
      <div class="tk-row">
        <label class="check">Error correction
          <select bind:value={ecl} style="width:auto"><option value="L">Low</option><option value="M">Medium</option><option value="Q">Quartile</option><option value="H">High</option></select></label>
        <label class="check">Size <input type="number" min="128" max="1024" step="32" bind:value={size} style="width:6rem" /></label>
      </div>
      <div class="tk-row">
        <label class="check">Dots <input type="color" bind:value={fg} /></label>
        <label class="check">Background <input type="color" bind:value={bg} /></label>
      </div>
    </div>
    <div>
      {#if svg}
        <div style="background:{bg};border:1px solid var(--border);display:grid;place-items:center;padding:1rem">
          <div style="width:min(100%,{size}px)">{@html svg.replace(/ width="\d+" height="\d+"/, ' style="width:100%;height:auto;display:block"')}</div>
        </div>
        <div class="tk-row" style="margin-top:.75rem">
          <button class="opt on" onclick={savePng}>Download PNG</button>
          <button class="opt" onclick={saveSvg}>Download SVG</button>
        </div>
      {:else if tooLong}<p class="err" role="alert">That's too much data for a QR code.</p>
      {:else}<p class="muted">Enter some content to make a code.</p>{/if}
    </div>
  </div>
</div>
