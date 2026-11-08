import DOMPurify from 'dompurify';
import type { ParsedMail } from './types';

function toDataUri(mime: string, data: ArrayBuffer): string {
  const bytes = new Uint8Array(data);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${mime};base64,${btoa(bin)}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export interface RenderedBody {
  srcdoc: string;
  /** Number of remote resources found (tracking pixels, hosted images). */
  remoteCount: number;
}

/**
 * Builds a locked-down document for a sandboxed iframe.
 * Layers: DOMPurify sanitising + iframe sandbox (no scripts) + CSP blocking remote loads.
 */
export function renderBody(mail: ParsedMail, allowRemote: boolean): RenderedBody {
  let body: string;
  let remoteCount = 0;

  if (mail.html) {
    let html = mail.html;
    // Resolve cid: references to the embedded attachments.
    for (const a of mail.attachments) {
      if (!a.contentId) continue;
      html = html.split(`cid:${a.contentId}`).join(toDataUri(a.mimeType, a.data));
    }
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer nofollow');
      }
    });
    body = DOMPurify.sanitize(html, { WHOLE_DOCUMENT: false, FORBID_TAGS: ['form', 'meta', 'base', 'link'] });
    DOMPurify.removeAllHooks();
    remoteCount = (body.match(/(?:src|background|srcset)=["']?\s*https?:/gi) ?? []).length;
  } else {
    body = `<pre>${escapeHtml(mail.text ?? '')}</pre>`;
  }

  const imgSrc = allowRemote ? "data: https: http:" : 'data:';
  const csp = `default-src 'none'; img-src ${imgSrc}; style-src 'unsafe-inline'; font-src data:`;
  const srcdoc = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<base target="_blank">
<style>
  body{margin:0;padding:16px;font:14px/1.5 system-ui,sans-serif;color:#1a1a1a;background:#fff;overflow-wrap:anywhere}
  pre{white-space:pre-wrap;font:13px/1.5 ui-monospace,monospace;margin:0}
  img{max-width:100%;height:auto}
</style></head><body>${body}</body></html>`;

  return { srcdoc, remoteCount };
}

export function formatAddress(a?: { name: string; address: string }): string {
  if (!a) return '';
  return a.name ? `${a.name} <${a.address}>` : a.address;
}

export function formatSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
