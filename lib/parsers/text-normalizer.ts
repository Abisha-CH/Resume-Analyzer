export function normalizeText(raw: string): string {
  return raw
    // Remove null bytes and non-printable control chars (keep \n \r \t)
    .replace(/[\u0000\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    // Normalize Windows line endings to Unix
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Collapse 3+ consecutive blank lines to 2 (one blank line separator)
    .replace(/\n{3,}/g, "\n\n")
    // Collapse multiple spaces/tabs within a line to a single space
    .replace(/[ \t]{2,}/g, " ")
    // Trim each line
    .split("\n").map(line => line.trim()).join("\n")
    // Trim the whole result
    .trim()
}
