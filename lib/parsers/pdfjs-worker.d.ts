/**
 * Type stub for pdfjs-dist's worker module.
 * The worker module exports a single WorkerMessageHandler class used to
 * bypass Turbopack's dynamic-import rewriting in ocr-fallback.ts.
 */
declare module "pdfjs-dist/legacy/build/pdf.worker.mjs" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const WorkerMessageHandler: any;
}
