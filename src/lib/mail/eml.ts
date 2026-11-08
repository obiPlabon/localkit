import PostalMime, { type Address } from 'postal-mime';
import type { MailAddress, ParsedMail } from './types';

function flatten(list?: Address[]): MailAddress[] {
  const out: MailAddress[] = [];
  for (const a of list ?? []) {
    if (a.group) out.push(...a.group.map((m) => ({ name: m.name, address: m.address })));
    else out.push({ name: a.name, address: a.address });
  }
  return out;
}

export async function parseEml(buffer: ArrayBuffer): Promise<ParsedMail> {
  const email = await PostalMime.parse(buffer);
  const from = email.from ? flatten([email.from])[0] : undefined;

  return {
    format: 'eml',
    subject: email.subject ?? '',
    from,
    replyTo: flatten(email.replyTo),
    to: flatten(email.to),
    cc: flatten(email.cc),
    bcc: flatten(email.bcc),
    date: email.date,
    messageId: email.messageId,
    html: email.html,
    text: email.text,
    headers: email.headers.map((h) => ({ key: h.originalKey, value: h.value })),
    attachments: email.attachments.map((a, i) => {
      const data =
        a.content instanceof ArrayBuffer
          ? a.content
          : typeof a.content === 'string'
            ? (new TextEncoder().encode(a.content).buffer as ArrayBuffer)
            : (a.content.buffer.slice(
                a.content.byteOffset,
                a.content.byteOffset + a.content.byteLength,
              ) as ArrayBuffer);
      return {
        filename: a.filename ?? `attachment-${i + 1}`,
        mimeType: a.mimeType,
        size: data.byteLength,
        contentId: a.contentId?.replace(/^<|>$/g, ''),
        inline: Boolean(a.related) || a.disposition === 'inline',
        data,
      };
    }),
  };
}
