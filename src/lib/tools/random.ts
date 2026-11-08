/** Unbiased random integer in [0, n) using the secure generator (rejection sampling). */
export function randInt(n: number): number {
  if (n <= 1) return 0;
  const max = 0x100000000;
  const limit = max - (max % n);
  const buf = new Uint32Array(1);
  let x: number;
  do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
  return x % n;
}

export function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function pick<T>(list: T[], count: number, unique: boolean): T[] {
  if (unique) return shuffle(list).slice(0, count);
  return Array.from({ length: count }, () => list[randInt(list.length)]);
}
