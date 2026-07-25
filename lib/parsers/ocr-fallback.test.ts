/**
 * Tests for the OCR fallback integration in the resume parsing pipeline.
 *
 * Scenarios covered:
 *  1. Text-based PDF  → normal parsePdf path, no OCR.
 *  2. Image-based PDF → OCR fallback is triggered and returns meaningful text.
 *  3. DOCX            → existing DOCX parser, no OCR.
 *  4. OCR text passes quality check → resume continues to "parsed".
 *  5. OCR text fails quality check  → clear parsing error.
 *
 * These tests use vitest and mock the heavy OCR dependencies so the suite runs
 * without requiring pdfjs-dist rendering or Tesseract in CI.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { isInsufficientExtractedText, MIN_ALPHA_CHARS } from "./ocr-fallback";
import { parse } from "./unified-parser";

// ─── Mock heavy OCR deps ────────────────────────────────────────────────────

vi.mock("./ocr-fallback", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("./ocr-fallback")>();
  return {
    ...original,
    // Replace ocrPdf with a controllable mock; the real implementation is
    // exercised through integration tests only (requires pdfjs/canvas/tesseract).
    ocrPdf: vi.fn(),
  };
});

// ─── Mock pdf-parser ────────────────────────────────────────────────────────

vi.mock("./pdf-parser", () => ({
  parsePdf: vi.fn(),
  PDF_PARSE_VERSION: "1.1.1",
}));

// ─── Mock docx-parser ───────────────────────────────────────────────────────

vi.mock("./docx-parser", () => ({
  parseDocx: vi.fn(),
  MAMMOTH_VERSION: "1.9.0",
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a string with exactly `n` alphabetic characters.
 * Padding uses only digits and spaces so it does NOT add alpha chars.
 */
function buildAlphaText(n: number): string {
  return "a".repeat(n) + " 12345 67890 11111 22222";
}

// ─── Unit tests for isInsufficientExtractedText ──────────────────────────────

describe("isInsufficientExtractedText", () => {
  it("returns false (sufficient) for a normal resume excerpt", () => {
    const text = `
      Jane Doe
      Software Engineer | jane@example.com | github.com/janedoe
      EXPERIENCE
      Senior Software Engineer — Acme Corp (2020–2024)
      Led a team of five engineers delivering microservices in TypeScript and Node.js.
      Reduced API latency by 40% through caching improvements.
      EDUCATION
      B.Sc. Computer Science, State University, 2016
    `.repeat(3); // ~150+ alpha chars
    expect(isInsufficientExtractedText(text)).toBe(false);
  });

  it("returns true (insufficient) for an empty string", () => {
    expect(isInsufficientExtractedText("")).toBe(true);
  });

  it("returns true (insufficient) for whitespace only", () => {
    expect(isInsufficientExtractedText("   \n\n\t  ")).toBe(true);
  });

  it("returns true (insufficient) when alpha count is below threshold", () => {
    // One less than the minimum threshold
    const sparse = buildAlphaText(MIN_ALPHA_CHARS - 1);
    expect(isInsufficientExtractedText(sparse)).toBe(true);
  });

  it("returns false (sufficient) when alpha count meets the threshold exactly", () => {
    const justEnough = buildAlphaText(MIN_ALPHA_CHARS);
    expect(isInsufficientExtractedText(justEnough)).toBe(false);
  });

  it("returns true (insufficient) for symbol-heavy garbage even if long", () => {
    // Simulate garbled encoding: mostly symbols, very few alphabetic chars
    const garbage = "!@#$%^&*()_+-=[]{}|;':\",./<>?".repeat(20) + "ab";
    expect(isInsufficientExtractedText(garbage)).toBe(true);
  });
});

// ─── Integration tests for unified parse() ───────────────────────────────────

describe("unified-parser: text-based PDF (Scenario 1)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the pdf-parse result directly without calling ocrPdf", async () => {
    const { parsePdf } = await import("./pdf-parser");
    const { ocrPdf } = await import("./ocr-fallback");

    const richText = "a".repeat(300) + " Engineer résumé content here.";
    vi.mocked(parsePdf).mockResolvedValue({
      success: true,
      text: richText,
      pageCount: 1,
      parserVersion: "pdf-parse@1.1.1",
    });

    const result = await parse(Buffer.from("fake-pdf"), "application/pdf");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.parserVersion).toBe("pdf-parse@1.1.1");
      expect(result.text).toBe(richText);
    }
    expect(vi.mocked(ocrPdf)).not.toHaveBeenCalled();
  });

  it("propagates a pdf-parse hard failure without calling ocrPdf", async () => {
    const { parsePdf } = await import("./pdf-parser");
    const { ocrPdf } = await import("./ocr-fallback");

    vi.mocked(parsePdf).mockResolvedValue({
      success: false,
      error: "PDF parse error: corrupted file",
    });

    const result = await parse(Buffer.from("bad-pdf"), "application/pdf");

    expect(result.success).toBe(false);
    expect(vi.mocked(ocrPdf)).not.toHaveBeenCalled();
  });
});

describe("unified-parser: image-based PDF triggers OCR (Scenario 2)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("falls back to OCR when pdf-parse returns insufficient text", async () => {
    const { parsePdf } = await import("./pdf-parser");
    const { ocrPdf } = await import("./ocr-fallback");

    // Simulate an image-only PDF: pdf-parse extracts nothing useful.
    vi.mocked(parsePdf).mockResolvedValue({
      success: true,
      text: "",
      pageCount: 1,
      parserVersion: "pdf-parse@1.1.1",
    });

    const ocrText = "a".repeat(300) + " OCR extracted resume content.";
    vi.mocked(ocrPdf).mockResolvedValue({
      success: true,
      text: ocrText,
      pageCount: 1,
      parserVersion: "pdfjs-dist@4.10.38+tesseract.js@5.1.1",
    });

    const result = await parse(Buffer.from("image-pdf"), "application/pdf");

    expect(vi.mocked(ocrPdf)).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.parserVersion).toContain("tesseract.js");
    }
  });
});

describe("unified-parser: DOCX (Scenario 3)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes DOCX to the mammoth parser and never calls ocrPdf", async () => {
    const { parseDocx } = await import("./docx-parser");
    const { ocrPdf } = await import("./ocr-fallback");

    const docxText = "a".repeat(400) + " DOCX resume content.";
    vi.mocked(parseDocx).mockResolvedValue({
      success: true,
      text: docxText,
      parserVersion: "mammoth@1.9.0",
    });

    const result = await parse(
      Buffer.from("fake-docx"),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.parserVersion).toBe("mammoth@1.9.0");
    }
    expect(vi.mocked(ocrPdf)).not.toHaveBeenCalled();
  });
});

describe("unified-parser: OCR produces meaningful text (Scenario 4)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the OCR result so the route can persist it as 'parsed'", async () => {
    const { parsePdf } = await import("./pdf-parser");
    const { ocrPdf } = await import("./ocr-fallback");

    vi.mocked(parsePdf).mockResolvedValue({
      success: true,
      text: "   ", // whitespace only → insufficient
      pageCount: 1,
      parserVersion: "pdf-parse@1.1.1",
    });

    const meaningfulOcrText =
      "John Smith\nSoftware Engineer\n" + "experience ".repeat(40);
    vi.mocked(ocrPdf).mockResolvedValue({
      success: true,
      text: meaningfulOcrText,
      pageCount: 1,
      parserVersion: "pdfjs-dist@4.10.38+tesseract.js@5.1.1",
    });

    const result = await parse(Buffer.from("image-pdf"), "application/pdf");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.text).toBe(meaningfulOcrText);
    }
  });
});

describe("unified-parser: OCR produces no meaningful text (Scenario 5)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a user-friendly error when both pdf-parse and OCR produce insufficient text", async () => {
    const { parsePdf } = await import("./pdf-parser");
    const { ocrPdf } = await import("./ocr-fallback");

    vi.mocked(parsePdf).mockResolvedValue({
      success: true,
      text: "",
      pageCount: 1,
      parserVersion: "pdf-parse@1.1.1",
    });

    // OCR succeeds technically but produces garbage / too-sparse text.
    vi.mocked(ocrPdf).mockResolvedValue({
      success: true,
      text: "   \n  \n  ",
      pageCount: 1,
      parserVersion: "pdfjs-dist@4.10.38+tesseract.js@5.1.1",
    });

    const result = await parse(Buffer.from("blank-scan"), "application/pdf");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("image-based or scanned PDF");
    }
  });

  it("returns a user-friendly error when OCR itself fails internally", async () => {
    const { parsePdf } = await import("./pdf-parser");
    const { ocrPdf } = await import("./ocr-fallback");

    vi.mocked(parsePdf).mockResolvedValue({
      success: true,
      text: "",
      pageCount: 1,
      parserVersion: "pdf-parse@1.1.1",
    });

    vi.mocked(ocrPdf).mockResolvedValue({
      success: false,
      error: "OCR error: out of memory",
    });

    const result = await parse(Buffer.from("bad-scan"), "application/pdf");

    expect(result.success).toBe(false);
    if (!result.success) {
      // Must be user-friendly, not expose the internal error message.
      expect(result.error).toContain("image-based or scanned PDF");
      expect(result.error).not.toContain("out of memory");
    }
  });
});
