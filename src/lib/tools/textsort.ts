import { shuffle } from './random';

export type SortMode = 'none' | 'az' | 'za' | 'natural' | 'short' | 'long' | 'reverse' | 'shuffle';

export interface Options {
  sort: SortMode;
  ignoreCase: boolean;
  dedupe: boolean;
  removeEmpty: boolean;
  trim: boolean;
  collapse: boolean;
}

export interface Result { lines: string[]; inCount: number; duplicates: number; empties: number }

export function process(text: string, o: Options): Result {
  let lines = text === '' ? [] : text.split(/\r?\n/);
  // A trailing newline is not an extra empty line.
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  const inCount = lines.length;

  if (o.trim) lines = lines.map((l) => l.trim());
  if (o.collapse) lines = lines.map((l) => l.replace(/[ \t]+/g, ' '));
  let empties = 0;
  if (o.removeEmpty) { const n = lines.length; lines = lines.filter((l) => l.trim() !== ''); empties = n - lines.length; }

  let duplicates = 0;
  if (o.dedupe) {
    const seen = new Set<string>();
    const n = lines.length;
    lines = lines.filter((l) => {
      const k = o.ignoreCase ? l.toLowerCase() : l;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    duplicates = n - lines.length;
  }

  const base: Intl.CollatorOptions = { sensitivity: o.ignoreCase ? 'base' : 'variant' };
  const cmp = new Intl.Collator(undefined, base).compare;
  const nat = new Intl.Collator(undefined, { ...base, numeric: true }).compare;
  switch (o.sort) {
    case 'az': lines.sort(cmp); break;
    case 'za': lines.sort((a, b) => cmp(b, a)); break;
    case 'natural': lines.sort(nat); break;
    case 'short': lines.sort((a, b) => a.length - b.length || cmp(a, b)); break;
    case 'long': lines.sort((a, b) => b.length - a.length || cmp(a, b)); break;
    case 'reverse': lines.reverse(); break;
    case 'shuffle': lines = shuffle(lines); break;
  }
  return { lines, inCount, duplicates, empties };
}
