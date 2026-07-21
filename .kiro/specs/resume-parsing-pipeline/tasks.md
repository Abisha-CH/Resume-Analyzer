# Implementation Plan: Resume Parsing Pipeline

## Overview

Implement the backend resume parsing pipeline by: (1) applying database migrations to add the `"parsed"` enum value and create the `resume_contents` table; (2) installing `pdf-parse` and `mammoth` parsing libraries; (3) implementing PDF and DOCX parsers, the unified parser interface, and the text normalizer; (4) adding the `downloadResume` storage helper; (5) implementing the `POST /api/resumes/[id]/parse` Route Handler with full status machine, ownership verification, and transactional persistence; and (6) verifying correctness with property tests and integration tests.

All parsing is server-side. No client components are created. The feature ends when `resumes.status = "parsed"` and a `resume_contents` row exists — ready for the AI Analysis Pipeline.

---

## Tasks

- [x] 1. Database Preparation
  - [x] 1.1 Update the `resume_status` Drizzle enum to include `"parsed"`
    - Edit `db/schema/resumes.ts`: add `"parsed"` between `"processing"` and `"analyzed"` in the `pgEnum` array
    - Resulting enum: `["pending", "processing", "parsed", "analyzed", "failed"]`
    - Update the `Resume` and `NewResume` inferred types (automatic via Drizzle)
    - _Requirements: 4.1_
    - _Files: `db/schema/resumes.ts`_
    - _Dependencies: none_
    - _Expected outcome: TypeScript accepts `"parsed"` as a valid `resume_status` value_

  - [x] 1.2 Create the `resume_contents` Drizzle schema file
    - Create `db/schema/resume-contents.ts` with the `resumeContents` table definition
    - Fields: `id` (text PK), `resumeId` (text UNIQUE FK → resumes.id ON DELETE CASCADE), `userId` (text FK → users.id ON DELETE CASCADE), `extractedText` (text NOT NULL), `wordCount` (integer NOT NULL), `charCount` (integer NOT NULL), `parserVersion` (varchar 100 NOT NULL), `parsedAt` (timestamp with timezone NOT NULL defaultNow)
    - Export `ResumeContent` and `NewResumeContent` inferred types
    - _Requirements: 10.1_
    - _Files: `db/schema/resume-contents.ts`_
    - _Dependencies: 1.1_
    - _Expected outcome: Drizzle schema compiles; `resumeContents` table type is fully typed_

  - [x] 1.3 Export `resumeContents` from the schema barrel
    - Edit `db/schema/index.ts` to re-export from `"./resume-contents"`
    - Verify `import { resumeContents } from "@/db"` resolves correctly
    - _Requirements: 10.1_
    - _Files: `db/schema/index.ts`_
    - _Dependencies: 1.2_
    - _Expected outcome: `resumeContents` is importable from `@/db`_

  - [x] 1.4 Generate and apply the database migration
    - Run `npx drizzle-kit generate` to produce `db/migrations/0001_parsed_status_and_resume_contents.sql`
    - Verify the generated SQL includes: `ALTER TYPE "public"."resume_status" ADD VALUE 'parsed'` and `CREATE TABLE "resume_contents" (...)`
    - Run `npx drizzle-kit migrate` (or the project's migration command) to apply the migration
    - _Requirements: 4.1, 10.1_
    - _Files: `db/migrations/0001_parsed_status_and_resume_contents.sql`_
    - _Dependencies: 1.1, 1.2, 1.3_
    - _Expected outcome: Migration applies cleanly; `\d resume_status` shows `parsed`; `\d resume_contents` shows all columns_


- [x] 2. Install Parsing Dependencies
  - [x] 2.1 Install `pdf-parse` and its TypeScript types
    - Run `npm install pdf-parse@1.1.1` and `npm install --save-dev @types/pdf-parse`
    - Verify `import pdfParse from "pdf-parse"` compiles without errors
    - _Requirements: 7.2, 14.2_
    - _Files: `package.json`_
    - _Dependencies: none_
    - _Expected outcome: `pdf-parse` is importable in TypeScript with full types_

  - [x] 2.2 Install `mammoth`
    - Run `npm install mammoth@1.9.0`
    - Verify `import mammoth from "mammoth"` compiles without errors (mammoth ships its own types)
    - _Requirements: 8.2, 14.3_
    - _Files: `package.json`_
    - _Dependencies: none_
    - _Expected outcome: `mammoth` is importable in TypeScript with full types_


- [x] 3. PDF Parser Implementation
  - [x] 3.1 Create `lib/parsers/pdf-parser.ts`
    - Import `pdfParse` from `"pdf-parse"`
    - Define and export `const PDF_PARSE_VERSION = "1.1.1"`
    - Implement `export async function parsePdf(buffer: Buffer): Promise<ParseResult>`
    - Wrap `pdfParse(buffer)` in a try/catch; on success return `{ success: true, text: result.text, pageCount: result.numpages, parserVersion: "pdf-parse@1.1.1" }`
    - On error: return `{ success: false, error: "PDF parse error: <message>" }`
    - An empty `result.text` string (scanned PDF) is a valid success with `text: ""`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_
    - _Files: `lib/parsers/pdf-parser.ts`_
    - _Dependencies: 2.1_
    - _Expected outcome: `parsePdf(buffer)` returns a typed `ParseResult` for both valid and invalid PDF buffers_

  - [ ] 3.2 Write property tests for the PDF parser _(deferred — not implemented)_
    - **Property 1: Round-trip — any valid PDF buffer returns `success: true` with non-null text**
    - **Validates: Requirements 7.1, 7.4**
    - **Property 2: Invalid/corrupted buffer always returns `{ success: false }`**
    - **Validates: Requirements 7.5**
    - **Property 3: `parserVersion` is always the string `"pdf-parse@1.1.1"` on success**
    - **Validates: Requirements 7.7**
    - Use real minimal PDF buffers for Property 1 (generate a 1-page text PDF programmatically or use a fixture)
    - Use `fast-check` to generate arbitrary random byte buffers for Property 2
    - Assert no exception escapes the function — all errors are wrapped in `ParseResult`
    - _Requirements: 7.1, 7.4, 7.5, 7.7_
    - _Files: `lib/parsers/__tests__/pdf-parser.test.ts`_
    - _Dependencies: 3.1_


- [x] 4. DOCX Parser Implementation
  - [x] 4.1 Create `lib/parsers/docx-parser.ts`
    - Import `mammoth` from `"mammoth"`
    - Define and export `const MAMMOTH_VERSION = "1.9.0"`
    - Implement `export async function parseDocx(buffer: Buffer): Promise<ParseResult>`
    - Call `mammoth.extractRawText({ buffer })` in a try/catch
    - On success: return `{ success: true, text: result.value, parserVersion: "mammoth@1.9.0" }`
    - On error: return `{ success: false, error: "DOCX parse error: <message>" }`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
    - _Files: `lib/parsers/docx-parser.ts`_
    - _Dependencies: 2.2_
    - _Expected outcome: `parseDocx(buffer)` returns a typed `ParseResult` for both valid and invalid DOCX buffers_

  - [ ] 4.2 Write property tests for the DOCX parser _(deferred — not implemented)_
    - **Property 4: Any valid DOCX buffer returns `success: true` with a string `text` value**
    - **Validates: Requirements 8.1, 8.4**
    - **Property 5: Invalid/corrupted buffer always returns `{ success: false }`**
    - **Validates: Requirements 8.5**
    - **Property 6: `parserVersion` is always `"mammoth@1.9.0"` on success**
    - **Validates: Requirements 8.2**
    - Use a minimal valid DOCX fixture buffer for Property 4
    - Use `fast-check` to generate arbitrary random byte buffers for Property 5
    - Assert no exception escapes the function
    - _Requirements: 8.1, 8.4, 8.5, 8.6_
    - _Files: `lib/parsers/__tests__/docx-parser.test.ts`_
    - _Dependencies: 4.1_


- [x] 5. Unified Parser Interface
  - [x] 5.1 Create `lib/parsers/unified-parser.ts`
    - Define and export the `ParseResult` discriminated union type: `{ success: true; text: string; pageCount?: number; parserVersion: string } | { success: false; error: string }`
    - Implement `export async function parse(buffer: Buffer, mimeType: string): Promise<ParseResult>`
    - When `mimeType === "application/pdf"`: delegate to `parsePdf(buffer)` from `./pdf-parser`
    - When `mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"`: delegate to `parseDocx(buffer)` from `./docx-parser`
    - Any other `mimeType`: return `{ success: false, error: "Unsupported MIME type: <mimeType>" }` without calling any parser
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
    - _Files: `lib/parsers/unified-parser.ts`_
    - _Dependencies: 3.1, 4.1_
    - _Expected outcome: `parse(buffer, "application/pdf")` calls `parsePdf`; `parse(buffer, "application/vnd…docx…")` calls `parseDocx`; unknown MIME returns error without calling either_

  - [ ] 5.2 Write property tests for the Unified_Parser routing _(deferred — not implemented)_
    - **Property 7: `parse(buffer, "application/pdf")` always delegates to PDF_Parser (never DOCX_Parser)**
    - **Property 8: `parse(buffer, "application/vnd…docx")` always delegates to DOCX_Parser (never PDF_Parser)**
    - **Property 9: `parse(buffer, mimeType)` for any non-PDF/non-DOCX MIME type returns `{ success: false }` without calling either parser**
    - **Validates: Requirements 6.1–6.5**
    - Use `fast-check` to generate arbitrary MIME type strings (excluding the two valid values) for Property 9
    - Mock `parsePdf` and `parseDocx` to assert which one is called
    - _Requirements: 6.1–6.5_
    - _Files: `lib/parsers/__tests__/unified-parser.test.ts`_
    - _Dependencies: 5.1_


- [x] 6. Text Normalization
  - [x] 6.1 Create `lib/parsers/text-normalizer.ts`
    - Implement `export function normalizeText(raw: string): string` as a pure function
    - Step 1: Remove null bytes and non-printable control characters (keep `\n`, `\r`, `\t`)
    - Step 2: Normalize Windows line endings (`\r\n` → `\n`, standalone `\r` → `\n`)
    - Step 3: Collapse 3+ consecutive newlines to 2 (`\n\n`)
    - Step 4: Collapse 2+ consecutive spaces/tabs within a line to a single space
    - Step 5: Trim each individual line
    - Step 6: Trim the final string
    - Return empty string for empty/whitespace-only input (not an error)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
    - _Files: `lib/parsers/text-normalizer.ts`_
    - _Dependencies: none_
    - _Expected outcome: `normalizeText` is a pure function with no side effects; all normalization rules apply in order_

  - [ ] 6.2 Write property tests for the Text_Normalizer _(deferred — not implemented)_
    - **Property 10: Idempotence — `normalizeText(normalizeText(s)) === normalizeText(s)` for all strings**
    - **Validates: Requirements 9.1–9.7 (normalization is stable after one application)**
    - **Property 11: Output never contains null bytes or non-printable control characters**
    - **Validates: Requirements 9.4**
    - **Property 12: Output never starts or ends with whitespace**
    - **Validates: Requirements 9.5**
    - **Property 13: Output never contains 3 or more consecutive newlines**
    - **Validates: Requirements 9.2**
    - **Property 14: Output never contains 2 or more consecutive spaces (within a line)**
    - **Validates: Requirements 9.3**
    - Use `fast-check` `fc.string()` and `fc.unicodeString()` to generate arbitrary input strings
    - _Requirements: 9.1–9.7_
    - _Files: `lib/parsers/__tests__/text-normalizer.test.ts`_
    - _Dependencies: 6.1_


- [x] 7. Supabase Storage Download Helper
  - [x] 7.1 Add `downloadResume` to `lib/supabase/storage.ts`
    - Add `export async function downloadResume(path: string): Promise<Buffer | null>`
    - Call `createServiceClient().storage.from("resumes").download(path)`
    - On error or null data: return `null`
    - On success: return `Buffer.from(await data.arrayBuffer())`
    - Follow the existing function documentation style in the file
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 13.2_
    - _Files: `lib/supabase/storage.ts`_
    - _Dependencies: none_
    - _Expected outcome: `downloadResume("user_x/resume.pdf")` returns a `Buffer` for existing objects and `null` for non-existent or error cases_


- [x] 8. Parse API Route Handler
  - [x] 8.1 Scaffold `app/api/resumes/[id]/parse/route.ts`
    - Create the directory and file
    - Add `export const runtime = "nodejs"` at the top
    - Export `export async function POST(request: Request, { params }: { params: Promise<{ id: string }> })`
    - Add `auth()` call; return 401 if `userId` is null
    - Await `params` and extract `resumeId`
    - Import `db`, `resumes`, `resumeContents` from `@/db`
    - Import `auth` from `@clerk/nextjs/server`
    - _Requirements: 1.1, 1.2, 1.3, 14.1_
    - _Files: `app/api/resumes/[id]/parse/route.ts`_
    - _Dependencies: 1.3_
    - _Expected outcome: Route file compiles; unauthenticated POST to `/api/resumes/<any-id>/parse` returns 401_

  - [x] 8.2 Add DB lookup, ownership check, and status pre-check
    - Query `resumes` by `resumeId`; return 404 if not found
    - Check `resume.userId !== userId`; return 403 if mismatch
    - Check current status: return 409 for `"processing"`, `"parsed"`, `"analyzed"`
    - Proceed for `"pending"` and `"failed"`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_
    - _Files: `app/api/resumes/[id]/parse/route.ts`_
    - _Dependencies: 8.1_
    - _Expected outcome: 404 for unknown IDs; 403 for wrong user; 409 for in-progress or completed resumes_

  - [x] 8.3 Add `setFailed` helper and `"processing"` status transition
    - Implement local `async function setFailed(resumeId: string, reason: string)` that updates status to `"failed"` and logs, wrapped in try/catch
    - After the status pre-check, call `UPDATE resumes SET status="processing"` using Drizzle
    - _Requirements: 4.2, 4.4, 12.1, 12.2, 12.3, 12.5_
    - _Files: `app/api/resumes/[id]/parse/route.ts`_
    - _Dependencies: 8.2_
    - _Expected outcome: Status is set to `"processing"` before any I/O; `setFailed` always exits `"processing"` to `"failed"`_

  - [x] 8.4 Add file download, parse, and normalize steps
    - Import `downloadResume` from `@/lib/supabase/storage`
    - Import `parse` from `@/lib/parsers/unified-parser`
    - Import `normalizeText` from `@/lib/parsers/text-normalizer`
    - Call `downloadResume(resume.storagePath)`; on null: call `setFailed` and return 500
    - Call `parse(buffer, resume.mimeType)`; on `success: false`: call `setFailed` and return 500
    - Call `normalizeText(parseResult.text)` to produce normalized text
    - Compute `wordCount` and `charCount` from normalized text
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 6.1–6.5, 7.1–7.7, 8.1–8.6, 9.1–9.7, 12.4_
    - _Files: `app/api/resumes/[id]/parse/route.ts`_
    - _Dependencies: 7.1, 5.1, 6.1_
    - _Expected outcome: Buffer is downloaded, parsed, and normalized before any DB write_

  - [x] 8.5 Add transactional persistence and success response
    - Open a Drizzle transaction
    - Upsert into `resume_contents` on conflict `resumeId` (update all fields)
    - Update `resumes.status` to `"parsed"` and `updatedAt` within the same transaction
    - On transaction failure: call `setFailed` and return 500
    - On success: return `Response.json({ resumeId, status: "parsed", wordCount, charCount, parserVersion }, { status: 200 })`
    - _Requirements: 4.3, 4.4, 10.1, 10.2, 10.3, 10.4, 11.1, 12.3, 13.3_
    - _Files: `app/api/resumes/[id]/parse/route.ts`_
    - _Dependencies: 8.4_
    - _Expected outcome: On success, `resumes.status = "parsed"` and `resume_contents` row exists; response body matches spec_

  - [ ] 8.6 Write property tests for the Parse_API handler _(deferred — not implemented)_
    - **Property 15: Any unauthenticated request returns 401 without any DB or Storage call**
    - **Validates: Requirements 1.1, 1.2**
    - **Property 16: Any authenticated request with a non-existent resume ID returns 404**
    - **Validates: Requirements 2.2**
    - **Property 17: Any request where `resume.userId !== auth().userId` returns 403 — for all pairs of distinct user IDs**
    - **Validates: Requirements 2.3, 2.5**
    - **Property 18: Status pre-check — any resume with status `"processing"`, `"parsed"`, or `"analyzed"` returns 409 without calling `downloadResume` or `parse`**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - **Property 19: No `resume_contents` write occurs when `parse()` returns `{ success: false }` for any error string**
    - **Validates: Requirements 12.4**
    - Use `fast-check` to generate arbitrary user IDs, resume IDs, and error strings; mock `auth`, `db`, `downloadResume`, `parse`
    - _Requirements: 1.1, 1.2, 2.2, 2.3, 2.5, 3.1–3.3, 12.4_
    - _Files: `app/api/resumes/[id]/parse/__tests__/parse-route.test.ts`_
    - _Dependencies: 8.5_


- [x] 9. Status State Machine Verification
  - [x] 9.1 Verify all status transition paths are covered
    - Manually trace every code path in the route handler and confirm each one that enters `"processing"` exits to `"parsed"` or `"failed"`
    - Confirm `setFailed` is called in every error path after `"processing"` is set
    - Confirm no code path returns 200 without the transaction having committed
    - Add inline comments in the route file documenting each exit point and the resulting status
    - _Requirements: 4.2, 4.3, 4.4, 12.1, 12.2, 12.3_
    - _Files: `app/api/resumes/[id]/parse/route.ts`_
    - _Dependencies: 8.5_
    - _Expected outcome: Code review confirms no `"processing"` leak; every exit point documented_


- [x] 10. Error Handling Completeness
  - [x] 10.1 Verify the Error Handling Matrix is fully implemented
    - Cross-reference the Error Handling Matrix from `design.md` against the route handler code
    - Confirm all 12 scenario rows have corresponding code paths
    - Confirm all 500 responses after `"processing"` is set call `setFailed`
    - Confirm no stack trace, Supabase error object, or Drizzle internal is included in any response body
    - _Requirements: 11.6, 11.8, 12.1–12.5_
    - _Files: `app/api/resumes/[id]/parse/route.ts`_
    - _Dependencies: 9.1_
    - _Expected outcome: All error paths match the Error Handling Matrix; no information leakage in responses_


- [x] 11. Integration Tests
  - [ ] 11.1 Write end-to-end integration tests for the parse flow _(deferred — not implemented)_
    - **Test A: Authenticated POST to `/api/resumes/[id]/parse` for a valid `"pending"` resume with a real PDF file in storage — verify response is 200 with correct fields, `resumes.status = "parsed"`, `resume_contents` row exists with non-empty `extracted_text`**
    - **Test B: Same as Test A but with a DOCX file**
    - **Test C: Unauthenticated POST returns 401; no DB changes**
    - **Test D: POST with a valid resume ID owned by a different user returns 403**
    - **Test E: POST for a resume with `status = "parsed"` returns 409**
    - **Test F: POST for a non-existent resume ID returns 404**
    - Use a real or emulated Supabase project and test database; seed test resumes and clean up after each test
    - _Requirements: 1.1, 2.1–2.5, 3.1–3.4, 4.3, 5.1, 10.1, 11.1_
    - _Files: `app/api/resumes/[id]/parse/__tests__/parse-integration.test.ts`_
    - _Dependencies: 8.5, 1.4, 7.1_


- [ ] 12. Final Verification
  - [x] 12.1 TypeScript compilation check
    - Run `npx tsc --noEmit` and confirm zero errors
    - Confirm `"parsed"` is accepted as a valid `resume_status` value throughout the codebase
    - Confirm `resumeContents` is fully typed in all import sites
    - _Requirements: all_
    - _Files: all modified files_
    - _Dependencies: 8.5, 1.4_
    - _Expected outcome: `tsc --noEmit` exits with code 0_

  - [ ] 12.2 Lint check _(partial — see notes below)_
    - Run `npm run lint` and confirm zero errors
    - _Requirements: all_
    - _Files: all modified files_
    - _Dependencies: 12.1_
    - _Expected outcome: ESLint exits with code 0_

  - [ ] 12.3 Manual smoke test
    - Upload a PDF resume via the existing upload flow to get a `resumeId` with `status = "pending"`
    - POST to `/api/resumes/<resumeId>/parse` with a valid session cookie
    - Confirm 200 response with `{ resumeId, status: "parsed", wordCount: <n>, charCount: <n>, parserVersion: "pdf-parse@1.1.1" }`
    - Query the database: confirm `resumes.status = "parsed"` and a `resume_contents` row with non-empty `extracted_text`
    - Repeat with a DOCX resume
    - Confirm a second POST to the same resume ID returns 409
    - _Requirements: all_
    - _Files: (runtime verification, no file changes)_
    - _Dependencies: 12.2_
    - _Expected outcome: Full parse pipeline works end-to-end in development environment_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all core implementation tasks (unmarked) are required.
- `export const runtime = "nodejs"` on the route file is **not optional** — both `pdf-parse` and `mammoth` require the Node.js runtime and will fail on the edge runtime.
- The `"parsed"` enum value uses `ALTER TYPE … ADD VALUE` which is non-destructive and does not require an exclusive table lock. Existing `"pending"`, `"processing"`, `"analyzed"`, and `"failed"` rows are unaffected.
- The `resume_contents` upsert uses `onConflictDoUpdate` targeting the `resumeId` UNIQUE constraint. This means a second successful parse of the same resume replaces the previous content row cleanly.
- `downloadResume` uses `createServiceClient()` internally (Service Role) — no signed URL is generated. The file never leaves the server process.
- `setFailed` is a best-effort helper. If it fails (rare DB connectivity issue), the resume may be stuck in `"processing"`. This is an operator-visible incident, not a silent failure. Log the secondary error.
- `wordCount` is computed as `text.trim().split(/\s+/).length` on the normalized text. An empty string returns 0 (handle the empty case with a guard: `text.trim() === "" ? 0 : ...`).
- `charCount` is `text.length` on the normalized text (after `trim()`).
- `parserVersion` is a hardcoded constant in each parser file. When the library is upgraded, update the constant and generate a new migration if re-parsing old resumes is desired.
- The Upload Pipeline's `resumes.storageUrl` is `null` (per its design). `downloadResume` uses `storagePath` directly — it does not need or use `storageUrl`.
- `fast-check` is the recommended property testing library (already referenced in the Upload Pipeline spec). Install with `npm install --save-dev fast-check` if not already present.


---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "2.1", "2.2"],
      "description": "Schema enum update and library installs — no mutual dependencies"
    },
    {
      "id": 1,
      "tasks": ["1.2", "6.1"],
      "description": "resume_contents schema and text normalizer — depend on 1.1; text normalizer has no deps"
    },
    {
      "id": 2,
      "tasks": ["1.3", "3.1", "4.1", "6.2"],
      "description": "Schema export, parsers created, normalizer property tests"
    },
    {
      "id": 3,
      "tasks": ["1.4", "3.2", "4.2", "5.1", "7.1"],
      "description": "DB migration applied, PDF/DOCX parser property tests, unified parser, download helper"
    },
    {
      "id": 4,
      "tasks": ["4.2", "5.2"],
      "description": "DOCX property tests (can run parallel to unified parser tests)"
    },
    {
      "id": 5,
      "tasks": ["8.1"],
      "description": "Route Handler scaffold — depends on 1.3"
    },
    {
      "id": 6,
      "tasks": ["8.2"],
      "description": "DB lookup, ownership, status pre-check"
    },
    {
      "id": 7,
      "tasks": ["8.3"],
      "description": "setFailed helper and processing transition"
    },
    {
      "id": 8,
      "tasks": ["8.4"],
      "description": "File download, parse, normalize — depends on 7.1, 5.1, 6.1"
    },
    {
      "id": 9,
      "tasks": ["8.5"],
      "description": "Transactional persistence and success response"
    },
    {
      "id": 10,
      "tasks": ["8.6", "9.1"],
      "description": "Route handler property tests and state machine verification"
    },
    {
      "id": 11,
      "tasks": ["10.1"],
      "description": "Error handling completeness review"
    },
    {
      "id": 12,
      "tasks": ["11.1"],
      "description": "Integration tests (optional)"
    },
    {
      "id": 13,
      "tasks": ["12.1", "12.2"],
      "description": "TypeScript and lint checks"
    },
    {
      "id": 14,
      "tasks": ["12.3"],
      "description": "Manual smoke test"
    }
  ]
}
```
