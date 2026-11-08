export type Op = { type: 'same' | 'add' | 'del'; text: string };

/** Line diff using LCS after trimming the common prefix and suffix. */
export function diffLines(a: string[], b: string[]): Op[] {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let ea = a.length, eb = b.length;
  while (ea > start && eb > start && a[ea - 1] === b[eb - 1]) { ea--; eb--; }

  const A = a.slice(start, ea), B = b.slice(start, eb);
  const ops: Op[] = a.slice(0, start).map((text) => ({ type: 'same', text }));

  if (A.length * B.length > 16_000_000) {
    // Too large for the table: fall back to a plain replace of the middle.
    A.forEach((text) => ops.push({ type: 'del', text }));
    B.forEach((text) => ops.push({ type: 'add', text }));
  } else {
    const w = B.length + 1;
    const t = new Uint32Array((A.length + 1) * w);
    for (let i = A.length - 1; i >= 0; i--)
      for (let j = B.length - 1; j >= 0; j--)
        t[i * w + j] = A[i] === B[j] ? t[(i + 1) * w + j + 1] + 1 : Math.max(t[(i + 1) * w + j], t[i * w + j + 1]);
    let i = 0, j = 0;
    while (i < A.length && j < B.length) {
      if (A[i] === B[j]) { ops.push({ type: 'same', text: A[i] }); i++; j++; }
      else if (t[(i + 1) * w + j] >= t[i * w + j + 1]) ops.push({ type: 'del', text: A[i++] });
      else ops.push({ type: 'add', text: B[j++] });
    }
    while (i < A.length) ops.push({ type: 'del', text: A[i++] });
    while (j < B.length) ops.push({ type: 'add', text: B[j++] });
  }
  for (let k = ea; k < a.length; k++) ops.push({ type: 'same', text: a[k] });
  return ops;
}
