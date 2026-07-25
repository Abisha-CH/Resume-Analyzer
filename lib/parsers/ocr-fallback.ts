/**
 * OCR fallback for image-based PDFs.
 *
 * Used when pdf-parse extracts insufficient text — typically because the PDF
 * contains scanned page images rather than embedded text.
 *
 * Pipeline:
 *   1. Load PDF with pdfjs-dist legacy build.
 *   2. Render each page to an off-screen canvas via @napi-rs/canvas.
 *   3. Export canvas pixels as PNG.
 *   4. Run Tesseract OCR on each page.
 *   5. Join page texts in document order.
 *
 * ─── Worker fix ───────────────────────────────────────────────────────────────
 * pdfjs-dist v4 always runs the fake-worker path in Node.js
 * (`PDFWorker.#isWorkerDisabled = true`), which calls:
 *
 *   const worker = await import(/*webpackIgnore: true*‌/ this.workerSrc)
 *
 * In Turbopack, even with `serverExternalPackages` and `webpackIgnore`, the
 * bundler intercepts that dynamic import() at build time and rewrites
 * `./pdf.worker.mjs` to a bundled reference that cannot be found at runtime,
 * producing:
 *   "Setting up fake worker failed: Cannot find module ... [app-route] (ecmascript)"
 *
 * Fix: override `PDFWorker._setupFakeWorkerGlobal` with a pre-resolved Promise
 * that returns the `WorkerMessageHandler` from a static import of the worker
 * module.  Because `pdf.worker.mjs` is imported statically (not dynamically),
 * Turbopack resolves it at build time as a known module rather than mangling a
 * runtime path string.  The `shadow()` caching inside PDFWorker uses
 * `configurable: true`, so this property can be safely overridden once before
 * any `getDocument` call.
 */

import type { ParseResult } from "./pdf-parser";

// ─── Thresholds ────────────────────────────────────────────────────────────

export const MIN_ALPHA_CHARS = 150;

export const MIN_ALPHA_RATIO = 0.4;

// ─── Version ───────────────────────────────────────────────────────────────

export const OCR_PARSER_VERSION =
  "pdfjs-dist@4.10.38+tesseract.js@5.1.1";

// ─── Quality helpers ───────────────────────────────────────────────────────

export function isInsufficientExtractedText(text: string): boolean {
  const alphaMatches = text.match(/[a-zA-Z]/g);
  const alphaCount = alphaMatches ? alphaMatches.length : 0;

  if (alphaCount < MIN_ALPHA_CHARS) {
    return true;
  }

  const nonWs = text.replace(/\s/g, "").length;

  if (nonWs > 0 && alphaCount / nonWs < MIN_ALPHA_RATIO) {
    return true;
  }

  return false;
}

// ─── OCR ───────────────────────────────────────────────────────────────────

export async function ocrPdf(buffer: Buffer): Promise<ParseResult> {
  let worker: Awaited<
    ReturnType<typeof import("tesseract.js")["createWorker"]>
  > | null = null;

  try {
    // ── Load heavy deps (kept as dynamic imports for the normal hot path) ──
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const workerMod = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    const { createCanvas } = await import("@napi-rs/canvas");
    const { createWorker } = await import("tesseract.js");

    // ── Override _setupFakeWorkerGlobal before any getDocument call ────────
    //
    // pdfjs v4 internally does:
    //   const worker = await import(/*webpackIgnore: true*/ this.workerSrc)
    // inside _setupFakeWorkerGlobal.  Turbopack rewrites that import() at
    // build time despite the webpackIgnore hint, breaking the path.
    //
    // By overriding the property with a Promise that already holds the
    // WorkerMessageHandler (imported statically above), the dynamic import()
    // never runs.  The property is defined with configurable:true by shadow(),
    // so Object.defineProperty can replace it.
    Object.defineProperty(pdfjsLib.PDFWorker, "_setupFakeWorkerGlobal", {
      value: Promise.resolve(workerMod.WorkerMessageHandler),
      configurable: true,
      enumerable: true,
      writable: false,
    });

    // ── 1. Load PDF ──────────────────────────────────────────────────────
    const uint8 = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );

    const pdfDocument = await pdfjsLib
      .getDocument({ data: uint8, verbosity: 0 })
      .promise;

    const numPages = pdfDocument.numPages;

    console.log(
      `[ocr-fallback] PDF loaded successfully: ${numPages} page(s)`
    );

    // ── 2. Initialise Tesseract ──────────────────────────────────────────
    worker = await createWorker("eng", 1, {
      logger: () => undefined,
      errorHandler: () => undefined,
    });

    const pageTexts: string[] = [];

    // ── 3. Render and OCR every page ─────────────────────────────────────
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      console.log(
        `[ocr-fallback] Processing page ${pageNum}/${numPages}`
      );

      const page = await pdfDocument.getPage(pageNum);

      // Render at 2× scale for improved OCR accuracy.
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height)
      );

      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise;

      // Convert rendered page to PNG for Tesseract.
      const pngBuffer = canvas.toBuffer("image/png");

      console.log(`[ocr-fallback] Running OCR on page ${pageNum}`);

      const { data } = await worker.recognize(pngBuffer);
      pageTexts.push(data.text);

      page.cleanup();
    }

    // ── 4. Cleanup ───────────────────────────────────────────────────────
    await worker.terminate();
    worker = null;

    await pdfDocument.destroy();

    // ── 5. Combine results ───────────────────────────────────────────────
    const text = pageTexts.join("\n\n");

    console.log(
      `[ocr-fallback] OCR completed. Extracted ${text.length} characters`
    );

    return {
      success: true,
      text,
      pageCount: numPages,
      parserVersion: OCR_PARSER_VERSION,
    };
  } catch (err) {
    // Always clean up Tesseract if an error occurs.
    if (worker) {
      try { await worker.terminate(); } catch { /* ignore */ }
    }

    const message = err instanceof Error ? err.message : String(err);
    console.error("[ocr-fallback] OCR error:", message);

    return {
      success: false,
      error: `OCR error: ${message}`,
    };
  }
}
