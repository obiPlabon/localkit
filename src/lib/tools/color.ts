export interface RGBA { r: number; g: number; b: number; a: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function parseColor(input: string): RGBA | null {
  const s = input.trim().toLowerCase();
  let m = s.match(/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    return {
      r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  const nums = (body: string) => body.split(/[\s,\/]+/).filter(Boolean);
  m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = nums(m[1]);
    if (p.length < 3) return null;
    const ch = (t: string) => (t.endsWith('%') ? (parseFloat(t) / 100) * 255 : parseFloat(t));
    const r = ch(p[0]), g = ch(p[1]), b = ch(p[2]);
    const a = p[3] ? (p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3])) : 1;
    if ([r, g, b, a].some(Number.isNaN)) return null;
    return { r: clamp(Math.round(r), 0, 255), g: clamp(Math.round(g), 0, 255), b: clamp(Math.round(b), 0, 255), a: clamp(a, 0, 1) };
  }
  m = s.match(/^hsla?\(([^)]+)\)$/);
  if (m) {
    const p = nums(m[1]);
    if (p.length < 3) return null;
    const h = parseFloat(p[0]), sat = parseFloat(p[1]), l = parseFloat(p[2]);
    const a = p[3] ? (p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3])) : 1;
    if ([h, sat, l, a].some(Number.isNaN)) return null;
    return { ...hslToRgb(h, sat, l), a: clamp(a, 0, 1) };
  }
  return null;
}

export function hslToRgb(h: number, s: number, l: number) {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

export function rgbToHsl({ r, g, b }: RGBA) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };

export function rgbToOklch({ r, g, b }: RGBA) {
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, Bb);
  let h = (Math.atan2(Bb, A) * 180) / Math.PI; if (h < 0) h += 360;
  return { l: L, c: C, h: C < 0.0004 ? 0 : h };
}

export function luminance({ r, g, b }: RGBA): number {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: RGBA, b: RGBA): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const hx = (n: number) => Math.round(n).toString(16).padStart(2, '0');
export const toHexString = (c: RGBA, withAlpha = false) =>
  `#${hx(c.r)}${hx(c.g)}${hx(c.b)}${withAlpha && c.a < 1 ? hx(c.a * 255) : ''}`;

const r1 = (n: number) => Math.round(n * 10) / 10;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function formats(c: RGBA) {
  const hsl = rgbToHsl(c), ok = rgbToOklch(c);
  const alpha = c.a < 1 ? ` / ${r3(c.a)}` : '';
  return [
    { label: 'HEX', value: toHexString(c, true) },
    { label: 'RGB', value: c.a < 1 ? `rgb(${c.r} ${c.g} ${c.b}${alpha})` : `rgb(${c.r}, ${c.g}, ${c.b})` },
    { label: 'HSL', value: c.a < 1 ? `hsl(${r1(hsl.h)} ${r1(hsl.s)}% ${r1(hsl.l)}%${alpha})` : `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)` },
    { label: 'OKLCH', value: `oklch(${r3(ok.l * 100)}% ${r3(ok.c)} ${r1(ok.h)}${alpha})` },
  ];
}
