/** RFC 4180 style CSV parser and writer with a configurable delimiter. */
export function parseCsv(text: string, delim = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = 0;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };
  while (i < src.length) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"' && field === '') { quoted = true; i++; continue; }
    if (c === delim) { pushField(); i++; continue; }
    if (c === '\r') { if (src[i + 1] === '\n') i++; pushRow(); i++; continue; }
    if (c === '\n') { pushRow(); i++; continue; }
    field += c; i++;
  }
  if (quoted) throw new Error('Unterminated quoted field.');
  if (field !== '' || row.length) pushRow();
  return rows;
}

export function stringifyCsv(rows: unknown[][], delim = ','): string {
  const esc = (v: unknown) => {
    const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return s.includes(delim) || /["\r\n]/.test(s) || /^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(delim)).join('\n');
}

/** Guess the delimiter from the first line. */
export function sniffDelimiter(text: string): string {
  const line = text.split(/\r?\n/, 1)[0] ?? '';
  const counts = [',', ';', '\t', '|'].map((d) => [d, line.split(d).length - 1] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

function coerce(v: string): unknown {
  if (v === '') return '';
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(v) && Number.isFinite(Number(v))) return Number(v);
  return v;
}

export function csvToJson(text: string, delim: string, header: boolean, infer: boolean): unknown[] {
  const rows = parseCsv(text, delim).filter((r) => !(r.length === 1 && r[0] === ''));
  const val = (v: string) => (infer ? coerce(v) : v);
  if (!header) return rows.map((r) => r.map(val));
  const [head, ...body] = rows;
  if (!head) return [];
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, val(r[i] ?? '')])));
}

export function jsonToCsv(data: unknown, delim: string): string {
  if (!Array.isArray(data)) throw new Error('JSON must be an array of objects or arrays.');
  if (data.length === 0) return '';
  if (data.every((r) => Array.isArray(r))) return stringifyCsv(data as unknown[][], delim);
  if (data.every((r) => r && typeof r === 'object' && !Array.isArray(r))) {
    const cols: string[] = [];
    for (const r of data as Record<string, unknown>[]) for (const k of Object.keys(r)) if (!cols.includes(k)) cols.push(k);
    return stringifyCsv([cols, ...(data as Record<string, unknown>[]).map((r) => cols.map((c) => r[c]))], delim);
  }
  throw new Error('Array items must all be objects or all be arrays.');
}
