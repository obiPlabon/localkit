/** Format-agnostic representation of a parsed email. Every parser (eml, msg) returns this. */
export interface MailAddress {
  name: string;
  address: string;
}

export interface MailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  contentId?: string;
  /** True when the HTML body references this part (inline image). */
  inline: boolean;
  data: ArrayBuffer;
}

export interface MailHeader {
  key: string;
  value: string;
}

export interface ParsedMail {
  format: 'eml' | 'msg';
  subject: string;
  from?: MailAddress;
  replyTo: MailAddress[];
  to: MailAddress[];
  cc: MailAddress[];
  bcc: MailAddress[];
  date?: string;
  messageId?: string;
  html?: string;
  text?: string;
  headers: MailHeader[];
  attachments: MailAttachment[];
}

export type WorkerRequest = { id: number; name: string; buffer: ArrayBuffer };
export type WorkerResponse =
  | { id: number; ok: true; mail: ParsedMail }
  | { id: number; ok: false; error: string };
