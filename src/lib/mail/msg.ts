import MsgReaderModule from '@kenjiuno/msgreader';
import { htmlFromCompressedRtf } from './rtf';
import type { MailAddress, MailHeader, ParsedMail } from './types';

/** Splits a raw RFC 822 header block (PR_TRANSPORT_MESSAGE_HEADERS) into unfolded entries. */
function parseHeaders(raw?: string): MailHeader[] {
  if (!raw) return [];
  const out: MailHeader[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (/^[ \t]/.test(line) && out.length) {
      out[out.length - 1].value += ' ' + line.trim();
      continue;
    }
    const i = line.indexOf(':');
    if (i > 0) out.push({ key: line.slice(0, i), value: line.slice(i + 1).trim() });
  }
  return out;
}

function toIso(value?: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

// The package is CommonJS; depending on the bundler the class is the default or default.default.
const MsgReader: typeof MsgReaderModule =
  (MsgReaderModule as unknown as { default?: typeof MsgReaderModule }).default ?? MsgReaderModule;

export function parseMsg(buffer: ArrayBuffer): ParsedMail {
  const reader = new MsgReader(buffer);
  const data = reader.getFileData();
  if (data.error) throw new Error(`Invalid .msg file: ${data.error}`);

  const recipients = (type: 'to' | 'cc' | 'bcc'): MailAddress[] =>
    (data.recipients ?? [])
      .filter((r) => (r.recipType ?? 'to') === type)
      .map((r) => ({ name: r.name ?? '', address: r.smtpAddress ?? r.email ?? '' }))
      // Avoid showing the display name twice when no address exists.
      .map((r) => (r.name === r.address ? { name: '', address: r.address } : r));

  let html = data.bodyHtml;
  if (!html && data.html?.length) html = new TextDecoder('utf-8').decode(data.html);
  // Many Outlook messages only carry HTML inside compressed RTF.
  if (!html && data.compressedRtf?.length) html = htmlFromCompressedRtf(data.compressedRtf);

  const headers = parseHeaders(data.headers);
  const replyToHeader = headers.find((h) => h.key.toLowerCase() === 'reply-to')?.value;
  const replyTo: MailAddress[] = replyToHeader
    ? replyToHeader.split(',').map((s) => {
        const m = s.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
        return m ? { name: m[1].trim(), address: m[2] } : { name: '', address: s.trim() };
      })
    : [];

  const senderAddress = data.senderSmtpAddress ?? data.senderEmail ?? '';

  const attachments = (data.attachments ?? []).map((a, i) => {
    const att = reader.getAttachment(a);
    const bytes = att.content;
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const contentId = a.pidContentId?.replace(/^<|>$/g, '') || undefined;
    return {
      filename: att.fileName || a.fileName || a.name || `attachment-${i + 1}`,
      mimeType: a.attachMimeTag || 'application/octet-stream',
      size: data.byteLength,
      contentId,
      inline: Boolean(contentId && html?.includes(`cid:${contentId}`)),
      data,
    };
  });

  return {
    format: 'msg',
    subject: data.subject ?? '',
    from: senderAddress || data.senderName ? { name: data.senderName ?? '', address: senderAddress } : undefined,
    replyTo,
    to: recipients('to'),
    cc: recipients('cc'),
    bcc: recipients('bcc'),
    date: toIso(data.messageDeliveryTime ?? data.clientSubmitTime ?? data.creationTime),
    messageId: data.messageId,
    html,
    text: data.body,
    headers,
    attachments,
  };
}
