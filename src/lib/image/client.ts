import { formatInfo, type EncodeRequest, type EncodeResponse, type EngineId, type Format } from './engines';

let worker: Worker | undefined;
let nextId = 0;

function viaWorker(req: Omit<EncodeRequest, 'id'>): Promise<Blob> {
  worker ??= new Worker(new URL('./encode.worker.ts', import.meta.url), { type: 'module' });
  const w = worker;
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const on = (e: MessageEvent<EncodeResponse>) => {
      if (e.data.id !== id) return;
      w.removeEventListener('message', on);
      if (e.data.ok) resolve(new Blob([e.data.data], { type: formatInfo[req.format].mime }));
      else reject(new Error(e.data.error));
    };
    w.addEventListener('message', on);
    w.postMessage({ ...req, id }, [req.pixels]);
  });
}

export interface Result { blob: Blob; width: number; height: number }

/** Decode, optionally downscale, then encode with the chosen engine. Runs fully on-device. */
export async function compress(
  file: File,
  opts: {
    engine: EngineId; format: Format; quality: number; maxWidth: number;
    /** Overrides maxWidth: pick the output size from the source size. */
    size?: (w: number, h: number) => { width: number; height: number };
  },
): Promise<Result> {
  const bmp = await createImageBitmap(file);
  let width: number, height: number;
  if (opts.size) {
    ({ width, height } = opts.size(bmp.width, bmp.height));
    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));
  } else {
    const scale = opts.maxWidth > 0 && bmp.width > opts.maxWidth ? opts.maxWidth / bmp.width : 1;
    width = Math.round(bmp.width * scale);
    height = Math.round(bmp.height * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: opts.engine === 'wasm' })!;
  if (opts.format === 'jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height); }
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close();

  if (opts.engine === 'browser') {
    const { mime } = formatInfo[opts.format];
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, mime, opts.quality / 100));
    if (!blob || blob.type !== mime) throw new Error(`This browser cannot export ${formatInfo[opts.format].label}. Try the Advanced engine.`);
    return { blob, width, height };
  }

  const pixels = ctx.getImageData(0, 0, width, height).data.buffer as ArrayBuffer;
  return { blob: await viaWorker({ format: opts.format, quality: opts.quality, width, height, pixels }), width, height };
}
