/** Standard 5-field cron: minute hour day-of-month month day-of-week. */
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ALIASES: Record<string, string> = {
  '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0', '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *',
};

interface Spec { name: string; min: number; max: number; names?: string[]; offset?: number }
const SPECS: Spec[] = [
  { name: 'minute', min: 0, max: 59 },
  { name: 'hour', min: 0, max: 23 },
  { name: 'day of month', min: 1, max: 31 },
  { name: 'month', min: 1, max: 12, names: MONTHS, offset: 1 },
  { name: 'day of week', min: 0, max: 7, names: DAYS, offset: 0 },
];

export interface Parsed {
  raw: string[];
  sets: Set<number>[];
  domStar: boolean;
  dowStar: boolean;
}

function num(tok: string, spec: Spec): number {
  const idx = spec.names ? spec.names.indexOf(tok.toUpperCase()) : -1;
  const n = idx >= 0 ? idx + (spec.offset ?? 0) : /^\d+$/.test(tok) ? Number(tok) : NaN;
  if (Number.isNaN(n)) throw new Error(`Invalid ${spec.name} value "${tok}".`);
  if (n < spec.min || n > spec.max) throw new Error(`${spec.name[0].toUpperCase()}${spec.name.slice(1)} must be ${spec.min}-${spec.max === 7 ? 6 : spec.max}, got ${n}.`);
  return n;
}

function parseField(raw: string, spec: Spec): Set<number> {
  const out = new Set<number>();
  for (const part of raw.split(',')) {
    if (!part) throw new Error(`Empty ${spec.name} list item.`);
    const [rangeStr, stepStr] = part.split('/');
    let step = 1;
    if (stepStr !== undefined) {
      step = Number(stepStr);
      if (!Number.isInteger(step) || step < 1) throw new Error(`Invalid step "${stepStr}" in ${spec.name}.`);
    }
    let lo: number, hi: number;
    if (rangeStr === '*' || rangeStr === '?') { lo = spec.min; hi = spec.name === 'day of week' ? 6 : spec.max; }
    else if (rangeStr.includes('-')) {
      const [a, b] = rangeStr.split('-');
      lo = num(a, spec); hi = num(b, spec);
      if (lo > hi) throw new Error(`Range ${rangeStr} in ${spec.name} is backwards.`);
    } else { lo = num(rangeStr, spec); hi = stepStr !== undefined ? spec.max : lo; }
    for (let v = lo; v <= hi; v += step) out.add(spec.name === 'day of week' && v === 7 ? 0 : v);
  }
  return out;
}

export function parseCron(expr: string): Parsed {
  let s = expr.trim().replace(/\s+/g, ' ');
  if (!s) throw new Error('Enter a cron expression.');
  if (s.startsWith('@')) {
    const a = ALIASES[s.toLowerCase()];
    if (!a) throw new Error(`Unknown shortcut ${s}.`);
    s = a;
  }
  const raw = s.split(' ');
  if (raw.length !== 5) throw new Error(`Expected 5 fields (minute hour day-of-month month day-of-week), got ${raw.length}.`);
  const sets = raw.map((r, i) => parseField(r, SPECS[i]));
  return { raw, sets, domStar: raw[2] === '*' || raw[2] === '?', dowStar: raw[4] === '*' || raw[4] === '?' };
}

function matchesDay(p: Parsed, d: Date): boolean {
  const dom = p.sets[2].has(d.getDate());
  const dow = p.sets[4].has(d.getDay());
  if (p.domStar && p.dowStar) return true;
  if (p.domStar) return dow;
  if (p.dowStar) return dom;
  return dom || dow; // classic cron: either matches when both are restricted
}

export function nextRuns(p: Parsed, from: Date, count: number): Date[] {
  const out: Date[] = [];
  const d = new Date(from.getTime());
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);
  const limit = new Date(from.getTime());
  limit.setFullYear(limit.getFullYear() + 8);
  while (out.length < count && d < limit) {
    if (!p.sets[3].has(d.getMonth() + 1) || !matchesDay(p, d)) { d.setDate(d.getDate() + 1); d.setHours(0, 0, 0, 0); continue; }
    if (!p.sets[1].has(d.getHours())) { d.setHours(d.getHours() + 1, 0, 0, 0); continue; }
    if (!p.sets[0].has(d.getMinutes())) { d.setMinutes(d.getMinutes() + 1, 0, 0); continue; }
    out.push(new Date(d.getTime()));
    d.setMinutes(d.getMinutes() + 1);
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const ord = (n: number) => { const v = n % 100; return n + (['th', 'st', 'nd', 'rd'][(v - 20) % 10] || ['th', 'st', 'nd', 'rd'][v] || 'th'); };

function sorted(s: Set<number>) { return [...s].sort((a, b) => a - b); }

export function describeCron(p: Parsed): string {
  const [mi, ho, dm, mo, dw] = p.raw;
  const minutes = sorted(p.sets[0]);
  const hours = sorted(p.sets[1]);
  const star = (f: string) => f === '*' || f === '?';
  let time: string;
  if (star(mi) && star(ho)) time = 'Every minute';
  else if (mi.startsWith('*/') && star(ho)) time = `Every ${mi.slice(2)} minutes`;
  else if (star(ho) && minutes.length === 1) time = minutes[0] === 0 ? 'Every hour, on the hour' : `At minute ${minutes[0]} past every hour`;
  else if (minutes.length === 1 && hours.length === 1) time = `At ${pad(hours[0])}:${pad(minutes[0])}`;
  else if (minutes.length === 1 && !star(ho)) time = `At ${list(hours.map((h) => `${pad(h)}:${pad(minutes[0])}`))}`;
  else if (/^\d+-\d+$/.test(ho) && (mi.startsWith('*/') || star(mi))) {
    const [a, b] = ho.split('-').map(Number);
    time = `${star(mi) ? 'Every minute' : `Every ${mi.slice(2)} minutes`}, between ${pad(a)}:00 and ${pad(b)}:59`;
  } else if (/^\d+-\d+$/.test(ho)) {
    const [a, b] = ho.split('-').map(Number);
    time = `At minutes ${list(minutes.map(String))}, between ${pad(a)}:00 and ${pad(b)}:59`;
  } else if (star(ho)) time = `At minutes ${list(minutes.map(String))} past every hour`;
  else if (ho.startsWith('*/')) time = `At minutes ${list(minutes.map(String))}, every ${ho.slice(2)} hours`;
  else time = `At minutes ${list(minutes.map(String))} past ${list(hours.map((h) => `${pad(h)}:00`))}`;

  const parts: string[] = [time];
  const days = sorted(p.sets[4]).map((d) => DAY_NAMES[d]);
  const doms = sorted(p.sets[2]);
  const months = sorted(p.sets[3]).map((m) => MONTH_NAMES[m - 1]);
  const dowText = days.length === 5 && !p.sets[4].has(0) && !p.sets[4].has(6) ? 'Monday through Friday' : list(days);
  if (!p.domStar && !p.dowStar) parts.push(`on the ${list(doms.map(ord))} of the month and on ${dowText}`);
  else if (!p.domStar) parts.push(doms.length === 31 ? '' : `on the ${list(doms.map(ord))} of the month`);
  else if (!p.dowStar) parts.push(`on ${dowText}`);
  if (!star(mo)) parts.push(`in ${list(months)}`);
  return parts.filter(Boolean).join(', ');
}
