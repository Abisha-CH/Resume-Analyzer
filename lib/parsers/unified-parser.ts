import { parsePdf } from "./pdf-parser"
import { parseDocx } from "./docx-parser"

export type ParseResult =
  | { success: true; text: string; pageCount?: number; parserVersion: string }
  | { success: false; error: string }

export async function parse(buffer: Buffer, mimeType: string): Promise<ParseResult> {
  if (mimeType === "application/pdf") {
    return parsePdf(buffer)
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return parseDocx(buffer)
  }
  return { success: false, error: `Unsupported MIME type: ${mimeType}` }
}
