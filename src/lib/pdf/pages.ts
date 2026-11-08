/** Parse "1-3, 5, 8-" into an ordered list of 0-based page indexes (duplicates and order are kept). */
export function parseRanges(text: string, total: number): number[] {
  const out: number[] = [];
  for (const raw of text.split(/[,\s]+/).filter(Boolean)) {
    const m = raw.match(/^(\d*)-(\d*)$/) ?? raw.match(/^(\d+)$/);
    if (!m) throw new Error(`"${raw}" is not a page or range.`);
    let a: number, b: number;
    if (m.length === 2) a = b = Number(m[1]);
    else { a = m[1] ? Number(m[1]) : 1; b = m[2] ? Number(m[2]) : total; }
    if (a < 1 || b < 1 || a > total || b > total) throw new Error(`Page ${a > total || a < 1 ? a : b} is outside 1-${total}.`);
    if (a <= b) for (let p = a; p <= b; p++) out.push(p - 1);
    else for (let p = a; p >= b; p--) out.push(p - 1);
  }
  return out;
}

/** Turn indexes back into compact text: [0,1,2,4] → "1-3, 5". */
export function formatRanges(pages: number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < pages.length; ) {
    let j = i;
    while (j + 1 < pages.length && pages[j + 1] === pages[j] + 1) j++;
    parts.push(j > i ? `${pages[i] + 1}-${pages[j] + 1}` : String(pages[i] + 1));
    i = j + 1;
  }
  return parts.join(', ');
}
