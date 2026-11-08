export interface SigOptions {
  name: string; title: string; company: string;
  phone: string; mobile: string; email: string; website: string; address: string;
  photo: string; round: boolean;
  linkedin: string; x: string; github: string; instagram: string;
  layout: 'classic' | 'stacked' | 'compact';
  color: string; font: string; size: number;
}

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = (s: string) => (/^(https?:|mailto:|tel:)/i.test(s) ? s : /^[\w.-]+\.[a-z]{2,}/i.test(s) ? `https://${s}` : s);
// Only allow http(s) links into the output; anything else (javascript:, data:) is dropped.
const safeUrl = (s: string) => { const u = url(s.trim()); return /^https?:\/\//i.test(u) ? u : ''; };
const telHref = (s: string) => 'tel:' + s.replace(/[^\d+]/g, '');
const stripScheme = (s: string) => s.replace(/^https?:\/\//i, '').replace(/\/$/, '');

export const fonts: Record<string, string> = {
  Arial: 'Arial, Helvetica, sans-serif',
  Verdana: 'Verdana, Geneva, sans-serif',
  Tahoma: 'Tahoma, Geneva, sans-serif',
  'Trebuchet MS': "'Trebuchet MS', Helvetica, sans-serif",
  Georgia: 'Georgia, Times, serif',
  'Times New Roman': "'Times New Roman', Times, serif",
};

export function buildSignature(o: SigOptions): string {
  const font = fonts[o.font] ?? fonts.Arial;
  const base = `font-family:${font};font-size:${o.size}px;line-height:1.45;color:#333333;`;
  const link = `color:${esc(o.color)};text-decoration:none;`;
  const muted = 'color:#777777;';

  const lines: string[] = [];
  const row = (label: string, inner: string) => lines.push(`<span style="${muted}">${label}&nbsp;</span>${inner}`);
  if (o.phone) row('T', `<a href="${esc(telHref(o.phone))}" style="${link}">${esc(o.phone)}</a>`);
  if (o.mobile) row('M', `<a href="${esc(telHref(o.mobile))}" style="${link}">${esc(o.mobile)}</a>`);
  if (o.email) row('E', `<a href="mailto:${esc(o.email)}" style="${link}">${esc(o.email)}</a>`);
  const site = safeUrl(o.website);
  if (o.website.trim()) row('W', site ? `<a href="${esc(site)}" style="${link}">${esc(stripScheme(site))}</a>` : esc(o.website));
  if (o.address) lines.push(`<span style="${muted}">${esc(o.address)}</span>`);

  const socials = ([['LinkedIn', o.linkedin], ['X', o.x], ['GitHub', o.github], ['Instagram', o.instagram]] as const)
    .map(([label, href]) => [label, safeUrl(href)] as const)
    .filter(([, h]) => h)
    .map(([label, h]) => `<a href="${esc(h)}" style="${link}font-weight:bold;">${label}</a>`)
    .join(`<span style="${muted}">&nbsp;&middot;&nbsp;</span>`);

  const nameLine = o.name ? `<div style="font-size:${o.size + 4}px;font-weight:bold;color:#111111;">${esc(o.name)}</div>` : '';
  const roleParts = [o.title && esc(o.title), o.company && `<span style="font-weight:bold;color:${esc(o.color)};">${esc(o.company)}</span>`].filter(Boolean);
  const roleLine = roleParts.length ? `<div style="${muted}">${roleParts.join('<span>&nbsp;|&nbsp;</span>')}</div>` : '';
  const details = lines.map((l) => `<div>${l}</div>`).join('');
  const socialLine = socials ? `<div style="margin-top:6px;">${socials}</div>` : '';

  const photo = safeUrl(o.photo) || /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(o.photo) ? o.photo : '';
  const img = photo
    ? `<img src="${esc(photo)}" width="88" height="88" alt="${esc(o.name)}" style="display:block;width:88px;height:88px;object-fit:cover;border:0;${o.round ? 'border-radius:50%;' : ''}" />`
    : '';

  if (o.layout === 'compact') {
    const bits = [o.name && `<strong style="color:#111111;">${esc(o.name)}</strong>`, o.title && esc(o.title), o.company && esc(o.company)].filter(Boolean).join(' | ');
    const contact = [
      o.phone && `<a href="${esc(telHref(o.phone))}" style="${link}">${esc(o.phone)}</a>`,
      o.email && `<a href="mailto:${esc(o.email)}" style="${link}">${esc(o.email)}</a>`,
      o.website.trim() && (site ? `<a href="${esc(site)}" style="${link}">${esc(stripScheme(site))}</a>` : esc(o.website)),
    ].filter(Boolean).join(' | ');
    return `<table cellpadding="0" cellspacing="0" border="0" style="${base}"><tr><td>${bits}${contact ? `<br />${contact}` : ''}${socialLine ? `<br />${socials}` : ''}</td></tr></table>`;
  }

  if (o.layout === 'stacked') {
    return `<table cellpadding="0" cellspacing="0" border="0" style="${base}"><tr><td>${img ? `<div style="margin-bottom:8px;">${img}</div>` : ''}${nameLine}${roleLine}<div style="height:2px;width:48px;background:${esc(o.color)};margin:8px 0;line-height:2px;font-size:2px;">&nbsp;</div>${details}${socialLine}</td></tr></table>`;
  }

  // classic: photo on the left, accent divider, details on the right
  return `<table cellpadding="0" cellspacing="0" border="0" style="${base}"><tr>${img ? `<td valign="top" style="padding-right:14px;">${img}</td>` : ''}<td valign="top" style="${img ? `border-left:3px solid ${esc(o.color)};padding-left:14px;` : ''}">${nameLine}${roleLine}<div style="height:6px;line-height:6px;font-size:6px;">&nbsp;</div>${details}${socialLine}</td></tr></table>`;
}
