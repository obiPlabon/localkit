/**
 * Minimal writer for Microsoft Compound File Binary (OLE2) containers, version 3 (512-byte sectors).
 * Enough to produce valid Outlook .msg files: storages, streams, mini stream, FAT and DIFAT.
 */
export interface CfbNode {
  name: string;
  /** Present on storages. */
  children?: CfbNode[];
  /** Present on streams. */
  data?: Uint8Array;
}

const SECTOR = 512, MINI = 64, CUTOFF = 4096;
const FREE = 0xffffffff, EOC = 0xfffffffe, FATSECT = 0xfffffffd, DIFSECT = 0xfffffffc, NOSTREAM = 0xffffffff;

interface Ent {
  node: CfbNode;
  type: 1 | 2 | 5;
  left: number; right: number; child: number;
  start: number; size: number;
}

const upper = (s: string) => s.toUpperCase();
function compareNames(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  const x = upper(a), y = upper(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

const ceilDiv = (a: number, b: number) => Math.ceil(a / b);

export function buildCfb(root: CfbNode): Uint8Array {
  // 1. Flatten into directory entries and build a balanced search tree per storage.
  const ents: Ent[] = [{ node: root, type: 5, left: NOSTREAM, right: NOSTREAM, child: NOSTREAM, start: EOC, size: 0 }];
  const layout = (parent: Ent) => {
    const kids = [...(parent.node.children ?? [])].sort((a, b) => compareNames(a.name, b.name));
    if (!kids.length) return;
    const first = ents.length;
    for (const k of kids) ents.push({ node: k, type: k.children ? 1 : 2, left: NOSTREAM, right: NOSTREAM, child: NOSTREAM, start: EOC, size: k.data?.length ?? 0 });
    const build = (lo: number, hi: number): number => {
      if (lo > hi) return NOSTREAM;
      const mid = (lo + hi) >> 1;
      const e = ents[first + mid];
      e.left = build(lo, mid - 1);
      e.right = build(mid + 1, hi);
      return first + mid;
    };
    parent.child = build(0, kids.length - 1);
    for (let i = 0; i < kids.length; i++) if (ents[first + i].type === 1) layout(ents[first + i]);
  };
  layout(ents[0]);

  // 2. Split streams between the mini stream (<4096 bytes) and regular sectors.
  const miniParts: Uint8Array[] = [];
  const miniFat: number[] = [];
  let miniCount = 0;
  const big: Ent[] = [];
  for (const e of ents) {
    if (e.type !== 2 || !e.node.data || e.node.data.length === 0) continue;
    if (e.node.data.length < CUTOFF) {
      const n = ceilDiv(e.node.data.length, MINI);
      e.start = miniCount;
      for (let i = 0; i < n; i++) miniFat.push(i < n - 1 ? miniCount + i + 1 : EOC);
      const padded = new Uint8Array(n * MINI);
      padded.set(e.node.data);
      miniParts.push(padded);
      miniCount += n;
    } else big.push(e);
  }
  const miniLen = miniCount * MINI;

  // 3. Count sectors and solve for the number of FAT / DIFAT sectors.
  const dirSectors = ceilDiv(ents.length * 128, SECTOR);
  const miniFatSectors = ceilDiv(miniFat.length * 4, SECTOR);
  const miniStreamSectors = ceilDiv(miniLen, SECTOR);
  const bigSectors = big.map((e) => ceilDiv(e.node.data!.length, SECTOR));
  const N = dirSectors + miniFatSectors + miniStreamSectors + bigSectors.reduce((a, b) => a + b, 0);
  let F = 0, D = 0;
  for (;;) {
    D = F > 109 ? ceilDiv(F - 109, 127) : 0;
    const need = ceilDiv(N + F + D, 128);
    if (need === F) break;
    F = need;
  }
  const total = N + F + D;

  // 4. Assign sector numbers and fill the FAT.
  const fat = new Uint32Array(F * 128).fill(FREE);
  let cur = 0;
  const chain = (start: number, count: number) => { for (let i = 0; i < count; i++) fat[start + i] = i < count - 1 ? start + i + 1 : EOC; };
  const dirStart = cur; chain(cur, dirSectors); cur += dirSectors;
  const miniFatStart = miniFatSectors ? cur : EOC; if (miniFatSectors) { chain(cur, miniFatSectors); cur += miniFatSectors; }
  const miniStreamStart = miniStreamSectors ? cur : EOC; if (miniStreamSectors) { chain(cur, miniStreamSectors); cur += miniStreamSectors; }
  big.forEach((e, i) => { e.start = cur; chain(cur, bigSectors[i]); cur += bigSectors[i]; });
  const fatStart = cur;
  for (let i = 0; i < F; i++) fat[fatStart + i] = FATSECT;
  cur += F;
  const difStart = cur;
  for (let i = 0; i < D; i++) fat[difStart + i] = DIFSECT;
  ents[0].start = miniStreamStart;
  ents[0].size = miniLen;

  // 5. Write everything.
  const out = new Uint8Array(SECTOR + total * SECTOR);
  const dv = new DataView(out.buffer);
  const secOff = (n: number) => SECTOR + n * SECTOR;

  [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].forEach((b, i) => (out[i] = b));
  dv.setUint16(24, 0x003e, true); dv.setUint16(26, 3, true); dv.setUint16(28, 0xfffe, true);
  dv.setUint16(30, 9, true); dv.setUint16(32, 6, true);
  dv.setUint32(44, F, true); dv.setUint32(48, dirStart, true); dv.setUint32(56, CUTOFF, true);
  dv.setUint32(60, miniFatStart, true); dv.setUint32(64, miniFatSectors, true);
  dv.setUint32(68, D ? difStart : EOC, true); dv.setUint32(72, D, true);
  for (let i = 0; i < 109; i++) dv.setUint32(76 + i * 4, i < F ? fatStart + i : FREE, true);

  for (let i = 0; i < D; i++) {
    const base = secOff(difStart + i);
    for (let j = 0; j < 127; j++) {
      const idx = 109 + i * 127 + j;
      dv.setUint32(base + j * 4, idx < F ? fatStart + idx : FREE, true);
    }
    dv.setUint32(base + 127 * 4, i < D - 1 ? difStart + i + 1 : EOC, true);
  }
  for (let i = 0; i < F * 128; i++) dv.setUint32(secOff(fatStart) + i * 4, fat[i], true);
  for (let i = 0; i < miniFat.length; i++) dv.setUint32(secOff(miniFatStart) + i * 4, miniFat[i], true);
  if (miniFatSectors) for (let i = miniFat.length; i < miniFatSectors * 128; i++) dv.setUint32(secOff(miniFatStart) + i * 4, FREE, true);
  let mo = 0;
  for (const p of miniParts) { out.set(p, secOff(miniStreamStart) + mo); mo += p.length; }
  for (const e of big) out.set(e.node.data!, secOff(e.start));

  // Directory
  for (let i = 0; i < dirSectors * 4; i++) {
    const o = secOff(dirStart) + i * 128;
    const e = ents[i];
    if (!e) { dv.setUint32(o + 68, NOSTREAM, true); dv.setUint32(o + 72, NOSTREAM, true); dv.setUint32(o + 76, NOSTREAM, true); continue; }
    const name = e.node.name;
    if (name.length > 31) throw new Error(`CFB name too long: ${name}`);
    for (let c = 0; c < name.length; c++) dv.setUint16(o + c * 2, name.charCodeAt(c), true);
    dv.setUint16(o + 64, (name.length + 1) * 2, true);
    out[o + 66] = e.type;
    out[o + 67] = 1; // black
    dv.setUint32(o + 68, e.left, true); dv.setUint32(o + 72, e.right, true); dv.setUint32(o + 76, e.child, true);
    dv.setUint32(o + 116, e.type === 1 ? 0 : e.start, true);
    dv.setUint32(o + 120, e.type === 1 ? 0 : e.size, true);
  }
  return out;
}
