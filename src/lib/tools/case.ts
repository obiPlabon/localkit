export function words(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'up']);

export const converters: { id: string; label: string; fn: (s: string) => string }[] = [
  { id: 'upper', label: 'UPPER CASE', fn: (s) => s.toUpperCase() },
  { id: 'lower', label: 'lower case', fn: (s) => s.toLowerCase() },
  {
    id: 'title', label: 'Title Case',
    fn: (s) => s.toLowerCase().replace(/\p{L}[\p{L}\p{N}'’]*/gu, (w, i) => (i > 0 && SMALL.has(w) ? w : cap(w))),
  },
  { id: 'sentence', label: 'Sentence case', fn: (s) => s.toLowerCase().replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, p, c) => p + c.toUpperCase()) },
  { id: 'camel', label: 'camelCase', fn: (s) => words(s).map((w, i) => (i ? cap(w) : w.toLowerCase())).join('') },
  { id: 'pascal', label: 'PascalCase', fn: (s) => words(s).map(cap).join('') },
  { id: 'snake', label: 'snake_case', fn: (s) => words(s).map((w) => w.toLowerCase()).join('_') },
  { id: 'constant', label: 'CONSTANT_CASE', fn: (s) => words(s).map((w) => w.toUpperCase()).join('_') },
  { id: 'kebab', label: 'kebab-case', fn: (s) => words(s).map((w) => w.toLowerCase()).join('-') },
  { id: 'dot', label: 'dot.case', fn: (s) => words(s).map((w) => w.toLowerCase()).join('.') },
  { id: 'alt', label: 'aLtErNaTiNg', fn: (s) => [...s].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join('') },
  { id: 'invert', label: 'iNVERT', fn: (s) => [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('') },
];
