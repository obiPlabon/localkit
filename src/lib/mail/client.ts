import type { ParsedMail, WorkerRequest, WorkerResponse } from './types';

let worker: Worker | undefined;
let nextId = 0;

/** Parses a mail file off the main thread. Nothing is ever uploaded. */
export function parseMailFile(file: File): Promise<ParsedMail> {
  worker ??= new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' });
  const w = worker;
  const id = ++nextId;

  return file.arrayBuffer().then(
    (buffer) =>
      new Promise<ParsedMail>((resolve, reject) => {
        const onMessage = (e: MessageEvent<WorkerResponse>) => {
          if (e.data.id !== id) return;
          w.removeEventListener('message', onMessage);
          if (e.data.ok) resolve(e.data.mail);
          else reject(new Error(e.data.error));
        };
        w.addEventListener('message', onMessage);
        const req: WorkerRequest = { id, name: file.name, buffer };
        w.postMessage(req, { transfer: [buffer] });
      }),
  );
}
