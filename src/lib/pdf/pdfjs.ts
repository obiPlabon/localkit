import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export type { PDFDocumentProxy } from 'pdfjs-dist';

export async function openPdf(data: Uint8Array) {
  // pdf.js transfers the buffer to its worker, so give it a copy.
  return pdfjs.getDocument({ data: data.slice() }).promise;
}

/** Render one page (1-based) to a canvas at the given scale (1 = 72 dpi). */
export async function renderPage(doc: Awaited<ReturnType<typeof openPdf>>, pageNo: number, scale: number): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNo);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, viewport }).promise;
  page.cleanup();
  return canvas;
}
