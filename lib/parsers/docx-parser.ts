import mammoth from "mammoth"

export const MAMMOTH_VERSION = "1.9.0"

type ParseResult =
  | { success: true; text: string; pageCount?: number; parserVersion: string }
  | { success: false; error: string }

export async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return {
      success: true,
      text: result.value,
      parserVersion: `mammoth@${MAMMOTH_VERSION}`,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: `DOCX parse error: ${message}` }
  }
}
