/** Time zone maths on top of Intl, with no date library. */
const fmtCache = new Map<string, Intl.DateTimeFormat>();
function dtf(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    fmtCache.set(tz, f);
  }
  return f;
}

/** Offset of `tz` from UTC at the given instant, in minutes (east is positive). */
export function offsetMinutes(utcMs: number, tz: string): number {
  const p: Record<string, number> = {};
  for (const part of dtf(tz).formatToParts(new Date(utcMs))) if (part.type !== 'literal') p[part.type] = Number(part.value);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}

/** The instant at which the wall clock in `tz` shows the given time. */
export function wallToUtc(y: number, mo: number, d: number, h: number, mi: number, tz: string): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let t = guess - offsetMinutes(guess, tz) * 60000;
  // Re-check once: the offset at the corrected instant can differ across a DST change.
  const off2 = offsetMinutes(t, tz);
  t = guess - off2 * 60000;
  return t;
}

export function formatOffset(min: number): string {
  const s = min < 0 ? '-' : '+';
  const a = Math.abs(min);
  return `UTC${s}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}

export function allZones(): string[] {
  try {
    const list = (Intl as any).supportedValuesOf('timeZone') as string[];
    return list.includes('UTC') ? list : ['UTC', ...list];
  } catch {
    return ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Tokyo', 'Australia/Sydney'];
  }
}

export function localZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function isoDate(ms: number, tz: string): string {
  const p: Record<string, string> = {};
  for (const part of dtf(tz).formatToParts(new Date(ms))) if (part.type !== 'literal') p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day}`;
}
