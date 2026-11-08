const WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum').split(' ');

function rnd(n: number): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function sentence(): string {
  const len = 8 + rnd(10);
  const w: string[] = [];
  for (let i = 0; i < len; i++) w.push(WORDS[rnd(WORDS.length)]);
  // sprinkle a comma or two
  for (const at of [Math.floor(len / 3), Math.floor((2 * len) / 3)]) if (rnd(2) && at > 1 && at < len - 1) w[at] += ',';
  return cap(w.join(' ')) + '.';
}

function paragraph(): string {
  const n = 3 + rnd(4);
  return Array.from({ length: n }, sentence).join(' ');
}

export type Unit = 'paragraphs' | 'sentences' | 'words';

export function generate(unit: Unit, count: number, classicStart: boolean): string {
  count = Math.max(1, Math.min(count, 1000));
  const start = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';
  if (unit === 'words') {
    const w: string[] = [];
    while (w.length < count) w.push(WORDS[rnd(WORDS.length)]);
    if (classicStart) start.toLowerCase().replace(',', '').split(' ').slice(0, count).forEach((x, i) => (w[i] = x));
    return cap(w.join(' ')) + '.';
  }
  if (unit === 'sentences') {
    const s = Array.from({ length: count }, sentence);
    if (classicStart) s[0] = start + '.';
    return s.join(' ');
  }
  const p = Array.from({ length: count }, paragraph);
  if (classicStart) p[0] = start + '. ' + p[0].split('. ').slice(1).join('. ');
  return p.join('\n\n');
}
