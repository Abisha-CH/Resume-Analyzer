// Import directly from the library file, not the package entry point (index.js).
// pdf-parse@1.1.1's index.js runs a self-test against a local fixture file at
// module evaluation time when `module.parent` is falsy (which it is in Next.js
// module bundling), causing an ENOENT crash on import. The library file at
// lib/pdf-parse.js is the real implementation with no such side effect.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as typeof import("pdf-parse")

export type ParseResult =
  | { success: true; text: string; pageCount?: number; parserVersion: string }
  | { success: false; error: string }

export const PDF_PARSE_VERSION = "1.1.1"

export async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await pdfParse(buffer)
    return {
      success: true,
      text: result.text,
      pageCount: result.numpages,
      parserVersion: `pdf-parse@${PDF_PARSE_VERSION}`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: `PDF parse error: ${message}` }
  }
}
