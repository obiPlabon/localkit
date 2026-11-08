/// <reference lib="webworker" />
import type { EncodeRequest, EncodeResponse } from './engines';

// Each codec is a WASM module; load it only the first time its format is used.
async function encode(req: EncodeRequest): Promise<ArrayBuffer> {
  const img = new ImageData(new Uint8ClampedArray(req.pixels), req.width, req.height);
  switch (req.format) {
    case 'jpeg': {
      const { default: enc } = await import('@jsquash/jpeg/encode.js');
      return enc(img, { quality: req.quality });
    }
    case 'webp': {
      const { default: enc } = await import('@jsquash/webp/encode.js');
      return enc(img, { quality: req.quality });
    }
    case 'avif': {
      const { default: enc } = await import('@jsquash/avif/encode.js');
      return enc(img, { quality: req.quality });
    }
    case 'png': {
      const { default: enc } = await import('@jsquash/png/encode.js');
      const { default: optimise } = await import('@jsquash/oxipng/optimise.js');
      return optimise(await enc(img), { level: 3 });
    }
  }
}

self.onmessage = async (e: MessageEvent<EncodeRequest>) => {
  const id = e.data.id;
  try {
    const data = await encode(e.data);
    const res: EncodeResponse = { id, ok: true, data };
    (self as unknown as Worker).postMessage(res, [data]);
  } catch (err) {
    const res: EncodeResponse = { id, ok: false, error: err instanceof Error ? err.message : 'Encoding failed.' };
    (self as unknown as Worker).postMessage(res);
  }
};
