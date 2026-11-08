import { decompressRTF } from '@kenjiuno/decompressrtf';

/**
 * Outlook stores many message bodies only as "compressed RTF" with the original HTML
 * encapsulated inside (MS-OXRTFCP / MS-OXRTFEX). This recovers that HTML.
 * Returns undefined when the RTF does not encapsulate HTML.
 */
export function htmlFromCompressedRtf(compressed: Uint8Array): string | undefined {
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(decompressRTF(Array.from(compressed)));
  } catch {
    return undefined;
  }
  return deEncapsulateHtml(bytes);
}

const CONTROL = /[a-zA-Z]/;
const DIGIT = /[0-9-]/;

interface Group {
  htmlrtf: boolean;
  /** 'tag' = inside {\*\htmltagN ...}, output verbatim. 'skip' = ignored destination. */
  mode: 'normal' | 'tag' | 'skip';
  /** Number of fallback chars to skip after \uN (\ucN). */
  uc: number;
}

export function deEncapsulateHtml(data: Uint8Array): string | undefined {
  // Strict 1 byte -> 1 char mapping (TextDecoder 'latin1' is really windows-1252, which would remap 0x80-0x9F).
  let src = '';
  for (let off = 0; off < data.length; off += 0x8000) {
    src += String.fromCharCode(...data.subarray(off, off + 0x8000));
  }
  if (!/\\fromhtml/.test(src.slice(0, 512))) return undefined;

  const cp = /\\ansicpg(\d+)/.exec(src.slice(0, 512))?.[1];
  let decoder: TextDecoder;
  try {
    decoder = new TextDecoder(cp ? (cp === '65001' ? 'utf-8' : `windows-${cp}`) : 'windows-1252');
  } catch {
    decoder = new TextDecoder('windows-1252');
  }

  const out: string[] = [];
  let pending: number[] = [];
  const flush = () => {
    if (pending.length) {
      out.push(decoder.decode(Uint8Array.from(pending)));
      pending = [];
    }
  };
  const emitText = (s: string) => {
    flush();
    out.push(s);
  };

  const stack: Group[] = [];
  let g: Group = { htmlrtf: false, mode: 'normal', uc: 1 };
  let skipChars = 0;
  let i = 0;
  const n = src.length;
  // Destinations that never carry visible body content.
  const SKIP_DEST = new Set(['fonttbl', 'colortbl', 'stylesheet', 'info', 'generator', 'mhtmltag', 'pntext', 'pn', 'listtable', 'listoverridetable']);

  const emitting = () => g.mode !== 'skip' && (g.mode === 'tag' || !g.htmlrtf);

  while (i < n) {
    const c = src[i];
    if (c === '{') {
      stack.push(g);
      g = { ...g };
      i++;
      // Look ahead for \* destinations
      if (src[i] === '\\' && src[i + 1] === '*') {
        const m = /^\\\*\\([a-zA-Z]+)(-?\d+)?/.exec(src.slice(i, i + 40));
        if (m) {
          g.mode = m[1] === 'htmltag' ? 'tag' : 'skip';
          i += m[0].length;
          if (src[i] === ' ') i++;
        }
      } else if (src[i] === '\\') {
        const m = /^\\([a-zA-Z]+)/.exec(src.slice(i, i + 24));
        if (m && SKIP_DEST.has(m[1])) g.mode = 'skip';
      }
    } else if (c === '}') {
      g = stack.pop() ?? g;
      i++;
    } else if (c === '\\') {
      i++;
      const d = src[i];
      if (d === "'") {
        const byte = parseInt(src.substr(i + 1, 2), 16);
        i += 3;
        if (skipChars > 0) skipChars--;
        else if (emitting() && !Number.isNaN(byte)) pending.push(byte);
      } else if (d !== undefined && CONTROL.test(d)) {
        let j = i;
        while (j < n && CONTROL.test(src[j])) j++;
        const word = src.slice(i, j);
        let k = j;
        if (src[k] === '-' || DIGIT.test(src[k] ?? '')) {
          k++;
          while (k < n && /[0-9]/.test(src[k])) k++;
        }
        const param = k > j ? parseInt(src.slice(j, k), 10) : undefined;
        i = k;
        if (src[i] === ' ') i++; // delimiter space
        switch (word) {
          case 'htmlrtf':
            g.htmlrtf = param !== 0;
            break;
          case 'uc':
            g.uc = param ?? 1;
            break;
          case 'u':
            if (emitting() && param !== undefined) emitText(String.fromCharCode(param < 0 ? param + 65536 : param));
            skipChars = g.uc;
            break;
          case 'par':
            if (emitting() && !g.htmlrtf) emitText('\r\n');
            break;
          case 'tab':
            if (emitting() && !g.htmlrtf) emitText('\t');
            break;
          case 'lbrace':
            if (emitting()) emitText('{');
            break;
          case 'rbrace':
            if (emitting()) emitText('}');
            break;
          case 'backslash':
            if (emitting()) emitText('\\');
            break;
        }
      } else if (d !== undefined) {
        i++;
        if (emitting() && (d === '{' || d === '}' || d === '\\')) emitText(d);
      }
    } else {
      i++;
      if (c === '\r' || c === '\n') continue;
      if (skipChars > 0) {
        skipChars--;
        continue;
      }
      if (emitting()) {
        const code = c.charCodeAt(0);
        if (code > 127) pending.push(code);
        else emitText(c);
      }
    }
  }
  flush();
  return out.join('');
}
