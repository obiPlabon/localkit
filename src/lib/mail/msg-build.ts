import { buildCfb, type CfbNode } from './cfb';
import type { MailAddress, ParsedMail } from './types';

// MAPI property types
const PT_I4 = 0x0003, PT_BOOL = 0x000b, PT_UNICODE = 0x001f, PT_TIME = 0x0040, PT_BINARY = 0x0102;

const utf16 = (s: string) => {
  const b = new Uint8Array(s.length * 2);
  const dv = new DataView(b.buffer);
  for (let i = 0; i < s.length; i++) dv.setUint16(i * 2, s.charCodeAt(i), true);
  return b;
};
const utf8 = (s: string) => new TextEncoder().encode(s);
const hex4 = (n: number) => n.toString(16).toUpperCase().padStart(4, '0');

/** Collects one object's properties: a fixed-size table plus a stream per variable-length value. */
class Props {
  private entries: Uint8Array[] = [];
  streams: CfbNode[] = [];

  private entry(id: number, type: number, size: number, low: number, high = 0, flags = 6) {
    const e = new Uint8Array(16);
    const dv = new DataView(e.buffer);
    dv.setUint32(0, ((id << 16) | type) >>> 0, true);
    dv.setUint32(4, flags, true);
    dv.setUint32(8, size >>> 0, true);
    dv.setUint32(12, 0, true);
    if (type !== PT_UNICODE && type !== PT_BINARY) { dv.setUint32(8, low >>> 0, true); dv.setUint32(12, high >>> 0, true); }
    this.entries.push(e);
  }
  str(id: number, value: string | undefined) {
    if (value === undefined || value === '') return;
    const data = utf16(value);
    this.streams.push({ name: `__substg1.0_${hex4(id)}${hex4(PT_UNICODE)}`, data });
    this.entry(id, PT_UNICODE, data.length + 2, 0);
  }
  bin(id: number, data: Uint8Array) {
    this.streams.push({ name: `__substg1.0_${hex4(id)}${hex4(PT_BINARY)}`, data });
    this.entry(id, PT_BINARY, data.length, 0);
  }
  i4(id: number, v: number) { this.entry(id, PT_I4, 0, v); }
  bool(id: number, v: boolean) { this.entry(id, PT_BOOL, 0, v ? 1 : 0); }
  time(id: number, iso?: string) {
    if (!iso) return;
    const ms = new Date(iso).getTime();
    if (Number.isNaN(ms)) return;
    const ft = (BigInt(ms) + 11644473600000n) * 10000n;
    this.entry(id, PT_TIME, 0, Number(ft & 0xffffffffn), Number(ft >> 32n));
  }
  /** Property stream with an 8-byte header (recipients, attachments) or a 32-byte one (the message). */
  table(header: Uint8Array): CfbNode {
    const data = new Uint8Array(header.length + this.entries.length * 16);
    data.set(header);
    this.entries.forEach((e, i) => data.set(e, header.length + i * 16));
    return { name: '__properties_version1.0', data };
  }
}

const display = (l: MailAddress[]) => l.map((a) => a.name || a.address).join('; ');

function recipient(a: MailAddress, type: number, row: number): CfbNode {
  const p = new Props();
  p.i4(0x0c15, type); // PR_RECIPIENT_TYPE
  p.str(0x3001, a.name || a.address); // PR_DISPLAY_NAME
  p.str(0x3002, 'SMTP');
  p.str(0x3003, a.address);
  p.str(0x39fe, a.address);
  p.i4(0x3000, row);
  p.i4(0x0ffe, 6); // PR_OBJECT_TYPE: mail user
  p.i4(0x3900, 0);
  return { name: `__recip_version1.0_#${row.toString(16).toUpperCase().padStart(8, '0')}`, children: [p.table(new Uint8Array(8)), ...p.streams] };
}

function attachment(a: ParsedMail['attachments'][number], index: number): CfbNode {
  const p = new Props();
  const data = new Uint8Array(a.data);
  const dot = a.filename.lastIndexOf('.');
  p.i4(0x0ffe, 7); // PR_OBJECT_TYPE: attachment
  p.i4(0x3705, 1); // ATTACH_BY_VALUE
  p.str(0x3704, a.filename.length > 8 ? a.filename.slice(0, 8) : a.filename);
  p.str(0x3707, a.filename);
  p.str(0x3001, a.filename);
  if (dot > 0) p.str(0x3703, a.filename.slice(dot));
  p.str(0x370e, a.mimeType);
  if (a.contentId) { p.str(0x3712, a.contentId); p.i4(0x3714, a.inline ? 4 : 0); p.bool(0x7ffe, a.inline); }
  p.i4(0x0e20, data.length); // PR_ATTACH_SIZE
  p.i4(0x0e21, index); // PR_ATTACH_NUM
  p.bin(0x3701, data);
  return { name: `__attach_version1.0_#${index.toString(16).toUpperCase().padStart(8, '0')}`, children: [p.table(new Uint8Array(8)), ...p.streams] };
}

/** Build an Outlook .msg (MAPI over OLE) from a parsed message. */
export function buildMsg(mail: ParsedMail): Uint8Array {
  const p = new Props();
  const hasAttach = mail.attachments.length > 0;

  p.str(0x001a, 'IPM.Note');
  p.str(0x0037, mail.subject); // PR_SUBJECT
  p.str(0x0070, mail.subject); // PR_CONVERSATION_TOPIC
  if (mail.from) {
    const name = mail.from.name || mail.from.address;
    for (const [nameId, addrId, typeId, smtpId] of [[0x0c1a, 0x0c1f, 0x0c1e, 0x5d01], [0x0042, 0x0065, 0x0064, 0x5d02]]) {
      p.str(nameId, name);
      p.str(typeId, 'SMTP');
      p.str(addrId, mail.from.address);
      p.str(smtpId, mail.from.address);
    }
  }
  p.str(0x0e04, display(mail.to)); // PR_DISPLAY_TO
  p.str(0x0e03, display(mail.cc));
  p.str(0x0e02, display(mail.bcc));
  p.str(0x007d, mail.headers.map((h) => `${h.key}: ${h.value}`).join('\r\n')); // PR_TRANSPORT_MESSAGE_HEADERS
  p.str(0x1035, mail.messageId); // PR_INTERNET_MESSAGE_ID
  p.str(0x1000, mail.text ?? (mail.html ? '' : '')); // PR_BODY
  if (mail.html) p.bin(0x1013, utf8(mail.html)); // PR_HTML
  p.i4(0x3fde, 65001); // PR_INTERNET_CPID: UTF-8
  p.i4(0x3ffd, 65001); // PR_MESSAGE_CODEPAGE
  p.time(0x0039, mail.date); // PR_CLIENT_SUBMIT_TIME
  p.time(0x0e06, mail.date); // PR_MESSAGE_DELIVERY_TIME
  p.time(0x3007, mail.date);
  p.time(0x3008, mail.date);
  p.i4(0x0e07, 1 | (hasAttach ? 0x10 : 0)); // PR_MESSAGE_FLAGS: read (+ has attachments)
  p.bool(0x0e1b, hasAttach);
  p.i4(0x0017, 1); // PR_IMPORTANCE normal

  const recips: CfbNode[] = [];
  let row = 0;
  for (const [list, type] of [[mail.to, 1], [mail.cc, 2], [mail.bcc, 3]] as const) {
    for (const a of list) if (a.address || a.name) recips.push(recipient(a, type, row++));
  }
  const atts = mail.attachments.map((a, i) => attachment(a, i));

  const header = new Uint8Array(32);
  const dv = new DataView(header.buffer);
  dv.setUint32(8, recips.length, true); // next recipient id
  dv.setUint32(12, atts.length, true); // next attachment id
  dv.setUint32(16, recips.length, true);
  dv.setUint32(20, atts.length, true);

  const empty = (n: string): CfbNode => ({ name: n, data: new Uint8Array(0) });
  const root: CfbNode = {
    name: 'Root Entry',
    children: [
      p.table(header),
      ...p.streams,
      ...recips,
      ...atts,
      { name: '__nameid_version1.0', children: [empty('__substg1.0_00020102'), empty('__substg1.0_00030102'), empty('__substg1.0_00040102')] },
    ],
  };
  return buildCfb(root);
}
