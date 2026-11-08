export type Format = 'jpeg' | 'webp' | 'png' | 'avif';
export type EngineId = 'browser' | 'wasm';

export interface Engine {
  id: EngineId;
  label: string;
  note: string;
  formats: Format[];
}

export const engines: Engine[] = [
  { id: 'browser', label: 'Browser', note: 'Instant. Uses your browser’s built-in encoder.', formats: ['webp', 'jpeg'] },
  { id: 'wasm', label: 'Advanced', note: 'Smaller files. MozJPEG, libwebp, OxiPNG and AVIF, loaded on demand.', formats: ['jpeg', 'webp', 'png', 'avif'] },
];

export const formatInfo: Record<Format, { label: string; mime: string; ext: string; lossy: boolean }> = {
  jpeg: { label: 'JPEG', mime: 'image/jpeg', ext: 'jpg', lossy: true },
  webp: { label: 'WebP', mime: 'image/webp', ext: 'webp', lossy: true },
  avif: { label: 'AVIF', mime: 'image/avif', ext: 'avif', lossy: true },
  png: { label: 'PNG', mime: 'image/png', ext: 'png', lossy: false },
};

export interface EncodeRequest {
  id: number;
  format: Format;
  quality: number; // 1-100
  width: number;
  height: number;
  pixels: ArrayBuffer; // RGBA
}
export type EncodeResponse = { id: number; ok: true; data: ArrayBuffer } | { id: number; ok: false; error: string };
