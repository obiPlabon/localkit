import { parseEml } from './eml';
import { parseMsg } from './msg';
import type { ParsedMail, WorkerRequest, WorkerResponse } from './types';

async function parse(name: string, buffer: ArrayBuffer): Promise<ParsedMail> {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'eml') return parseEml(buffer);
  if (ext === 'msg') return parseMsg(buffer);
  throw new Error(`Unsupported file type: .${ext ?? ''}`);
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, name, buffer } = e.data;
  try {
    const mail = await parse(name, buffer);
    const res: WorkerResponse = { id, ok: true, mail };
    self.postMessage(res, { transfer: mail.attachments.map((a) => a.data) });
  } catch (err) {
    const res: WorkerResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(res);
  }
};
