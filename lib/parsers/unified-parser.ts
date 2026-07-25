import { parsePdf } from "./pdf-parser";
import { parseDocx } from "./docx-parser";
import { isInsufficientExtractedText, ocrPdf } from "./ocr-fallback";
import { normalizeText } from "./text-normalizer";

export type ParseResult =
  | { success: true; text: string; pageCount?: number; parserVersion: string }
  | { success: false; error: string }

export async function parse(buffer: Buffer, mimeType: string): Promise<ParseResult> {
  if (mimeType === "application/pdf") {
    // ── Normal text-extraction path (unchanged) ──────────────────────────
    const pdfResult = await parsePdf(buffer);
    if (!pdfResult.success) {
      return pdfResult;
    }

    // ── OCR fallback: triggered only when extracted text is insufficient ──
    // Normalise first so the quality check sees the same text the DB would store.
    const normalised = normalizeText(pdfResult.text);
    if (!isInsufficientExtractedText(normalised)) {
      // Sufficient text — return the normal result unchanged.
      return pdfResult;
    }

    console.info(
      "[unified-parser] PDF text insufficient — attempting OCR fallback"
    );

    const ocrResult = await ocrPdf(buffer);

    if (!ocrResult.success) {
      // OCR itself threw an internal error.  Surface a user-friendly message
      // rather than the raw library error.
      return {
        success: false,
        error:
          "This PDF could not be read. It may be an image-based or scanned PDF " +
          "with unclear text. Please upload a text-based PDF or DOCX resume.",
      };
    }

    // OCR produced output — check its quality before accepting it.
    const ocrNormalised = normalizeText(ocrResult.text);
    if (isInsufficientExtractedText(ocrNormalised)) {
      return {
        success: false,
        error:
          "This PDF could not be read. It may be an image-based or scanned PDF " +
          "with unclear text. Please upload a text-based PDF or DOCX resume.",
      };
    }

    // Return the OCR result; the caller (route.ts) will normalise again and
    // persist as usual.  The text field here is the raw OCR output; the route
    // always calls normalizeText independently so that is fine.
    return ocrResult;
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return parseDocx(buffer);
  }

  return { success: false, error: `Unsupported MIME type: ${mimeType}` };
}
