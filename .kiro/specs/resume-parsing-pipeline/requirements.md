# Requirements Document

## Introduction

The **Resume Parsing Pipeline** feature enables the system to extract plain text from previously uploaded resume files (PDF or DOCX) stored in Supabase Storage. It is the direct successor to the Resume Upload Pipeline: once a resume has been uploaded and a `resumes` row exists with `status = "pending"`, a caller triggers `POST /api/resumes/[id]/parse` to download the file server-side, detect its format, extract its text content, normalize it, persist it to the database, and advance the resume's status to `"parsed"`.

All file access, parsing, and persistence operations are performed exclusively on the server. No resume content is ever returned to or stored by the browser. The parsed text is the input to the forthcoming AI Analysis Pipeline — this feature ends at text extraction and stops before any LLM call, scoring, or analysis.

---

## Glossary

- **Parse_API**: The Next.js Route Handler at `POST /api/resumes/[id]/parse` responsible for authenticating the request, verifying resume ownership, downloading the file from Supabase Storage, routing it to the correct parser, normalizing the result, persisting the extracted text, and updating the resume status.
- **Resume_Record**: A row in the `resumes` database table. At the start of parsing it has `status = "pending"` or `status = "failed"` (for retries). The Parse_API transitions it to `"processing"` before parsing and then to `"parsed"` on success or `"failed"` on error.
- **Resume_Content_Record**: A row in the `resume_contents` database table that stores the extracted text and parsing metadata for one Resume_Record. One Resume_Record has at most one Resume_Content_Record.
- **Resume_ID**: The UUID primary key of a Resume_Record, supplied as the `[id]` path parameter in the Parse_API URL.
- **Clerk_User_ID**: The string identifier (e.g. `"user_2abc…"`) assigned by Clerk to an authenticated user. `users.id` stores the Clerk_User_ID directly. See the [User Identity Design Clarification](#user-identity-design-clarification) section.
- **Storage_Path**: The location of a resume file within the `"resumes"` Supabase Storage bucket, stored as `resumes.storage_path` (e.g. `user_2abc123/f47ac10b-….pdf`).
- **Service_Client**: The Supabase client created via `createServiceClient()` from `lib/supabase/server.ts`, initialized with `SUPABASE_SERVICE_ROLE_KEY`. Used server-side to download private files, bypassing Row Level Security.
- **PDF_Parser**: The server-side module (implemented using `pdf-parse`) that accepts a `Buffer` containing a PDF file and returns extracted plain text.
- **DOCX_Parser**: The server-side module (implemented using `mammoth`) that accepts a `Buffer` containing a DOCX file and returns extracted plain text.
- **Unified_Parser**: The routing layer that inspects a resume's `mimeType` field and delegates to either PDF_Parser or DOCX_Parser, returning a normalized `ParseResult`.
- **ParseResult**: The structured result returned by the Unified_Parser: `{ text: string; wordCount: number; charCount: number; parserVersion: string }` on success, or an error indicator on failure.
- **Text_Normalizer**: The module that post-processes raw extracted text to remove control characters, collapse excessive whitespace, and strip encoding artifacts before persistence.
- **Extracted_Text**: The normalized plain-text string produced by the Unified_Parser and Text_Normalizer from the resume file content.
- **Parser_Version**: A string that identifies the parsing library and version used to extract the text (e.g. `"pdf-parse@1.1.1"` or `"mammoth@1.9.0"`). Stored in `resume_contents.parser_version` to support future re-parsing decisions.
- **MIME_Type**: The `mimeType` field of the Resume_Record, set at upload time. Valid values for parsing are `"application/pdf"` and `"application/vnd.openxmlformats-officedocument.wordprocessingml.document"`.
- **pending**: A `resume_status` enum value indicating the resume has been uploaded but not yet parsed.
- **processing**: A `resume_status` enum value indicating the Parse_API has begun processing this resume.
- **parsed**: A `resume_status` enum value indicating parsing completed successfully and Extracted_Text is stored. **This value must be added to the `resume_status` enum via a database migration.**
- **analyzed**: A `resume_status` enum value indicating the AI Analysis Pipeline has completed analysis (future milestone; out of scope here).
- **failed**: A `resume_status` enum value indicating a terminal error occurred during parsing or analysis.

---

## User Identity Design Clarification

The `users` table schema (confirmed by migration `0000_right_marvex.sql`) stores the Clerk User ID in both `users.id` (primary key) and `users.clerk_id` (redundant unique column). The Clerk webhook handler at `app/api/webhooks/clerk/route.ts` sets both columns to the same value on every `user.created` event.

**Consequence for the Parse_API:** `auth().userId` from `@clerk/nextjs/server` returns the Clerk User ID string, which is directly usable as the comparison value against `resumes.user_id`. No additional database lookup is needed to resolve an internal user identifier. The ownership check is simply `WHERE resumes.id = $resumeId AND resumes.user_id = $clerkUserId`.

---

## Requirements

---

### Requirement 1: Authentication Enforcement

**User Story:** As a product owner, I want every parse request to be authenticated, so that only the resume's owner can trigger text extraction.

#### Acceptance Criteria

1. WHEN a request is received at `POST /api/resumes/[id]/parse`, THE Parse_API SHALL verify the caller's identity by invoking `auth()` from `@clerk/nextjs/server` on the server side.
2. IF the `auth()` call returns a null or absent `userId`, THEN THE Parse_API SHALL return an HTTP 401 response with a JSON body containing the field `"error"` set to a human-readable unauthenticated message.
3. THE Parse_API SHALL retrieve the Clerk_User_ID exclusively from the server-side `auth()` call and SHALL NOT accept any user identity value supplied in the request body, query string, or headers by the client.

---

### Requirement 2: Resume Ownership Verification

**User Story:** As a user, I want to be certain that only I can trigger parsing of my own resumes, so that other users cannot access or process my files.

#### Acceptance Criteria

1. WHEN the Parse_API receives an authenticated request, THE Parse_API SHALL query the `resumes` table to retrieve the Resume_Record matching the provided Resume_ID.
2. IF no Resume_Record exists with the provided Resume_ID, THEN THE Parse_API SHALL return an HTTP 404 response with a JSON body containing the field `"error"` set to a human-readable not-found message.
3. IF the `userId` field of the retrieved Resume_Record does not equal the Clerk_User_ID from `auth()`, THEN THE Parse_API SHALL return an HTTP 403 response with a JSON body containing the field `"error"` set to a human-readable forbidden message.
4. THE Parse_API SHALL perform the ownership check by comparing `resumes.user_id` directly against `auth().userId`, without any intermediate user-table lookup.
5. THE Parse_API SHALL NOT reveal whether a Resume_Record belonging to a different user exists; a mismatch SHALL return 403, not 404.

---

### Requirement 3: Resume Status Pre-check

**User Story:** As an engineer, I want the system to reject parse requests for resumes that are already being processed or successfully parsed, so that duplicate or concurrent parse operations cannot corrupt the stored state.

#### Acceptance Criteria

1. WHEN the Parse_API retrieves a Resume_Record with `status = "processing"`, THE Parse_API SHALL return an HTTP 409 response with a JSON body containing the field `"error"` indicating a parse is already in progress.
2. WHEN the Parse_API retrieves a Resume_Record with `status = "parsed"`, THE Parse_API SHALL return an HTTP 409 response with a JSON body containing the field `"error"` indicating the resume has already been successfully parsed.
3. WHEN the Parse_API retrieves a Resume_Record with `status = "analyzed"`, THE Parse_API SHALL return an HTTP 409 response with a JSON body containing the field `"error"` indicating the resume has already been fully analyzed.
4. WHEN the Parse_API retrieves a Resume_Record with `status = "pending"` or `status = "failed"`, THE Parse_API SHALL proceed to the file download step.

---

### Requirement 4: Status Lifecycle — `"parsed"` Enum Value

**User Story:** As an engineer, I want a dedicated `"parsed"` status to distinguish "text extracted, ready for AI" from "being actively processed", so that the AI Analysis Pipeline can reliably query for resumes that are ready.

#### Acceptance Criteria

1. THE database SHALL have the `resume_status` enum extended to include the value `"parsed"`, resulting in the ordered set `"pending" | "processing" | "parsed" | "analyzed" | "failed"`.
2. THE Parse_API SHALL transition a Resume_Record's status from `"pending"` (or `"failed"`) to `"processing"` before initiating any file download or parsing operation.
3. WHEN parsing and persistence succeed, THE Parse_API SHALL transition the Resume_Record's status from `"processing"` to `"parsed"`.
4. WHEN parsing or persistence fails, THE Parse_API SHALL transition the Resume_Record's status from `"processing"` to `"failed"` and SHALL store a human-readable error description in a designated error field.
5. THE Parse_API SHALL NOT set status to `"analyzed"` — that transition is reserved for the AI Analysis Pipeline.

---

### Requirement 5: File Retrieval from Supabase Storage

**User Story:** As a user, I want my resume file to be downloaded securely server-side for parsing, so that the raw file content is never exposed to any client.

#### Acceptance Criteria

1. WHEN ownership is verified and the status pre-check passes, THE Parse_API SHALL download the resume file from Supabase Storage using the `storage_path` field of the Resume_Record and the Service_Client.
2. THE Parse_API SHALL use `supabase.storage.from("resumes").download(storagePath)` via the Service_Client to retrieve the file as a raw binary blob.
3. THE Parse_API SHALL convert the downloaded blob to a `Buffer` before passing it to the Unified_Parser.
4. THE Parse_API SHALL NOT generate or use a signed URL to retrieve the file for parsing; direct server-side download via the Service_Client is the required access method.
5. IF the file download fails (object not found, network error, or any other storage error), THEN THE Parse_API SHALL transition the Resume_Record's status to `"failed"`, record the error, and return an HTTP 500 response with a JSON body containing the field `"error"`.

---

### Requirement 6: Format Detection

**User Story:** As an engineer, I want format detection to be based on the stored MIME type rather than the file extension, so that the routing decision is based on validated, server-authoritative metadata.

#### Acceptance Criteria

1. THE Unified_Parser SHALL determine the file format by inspecting the `mimeType` field of the Resume_Record.
2. WHEN `mimeType` is `"application/pdf"`, THE Unified_Parser SHALL route the Buffer to the PDF_Parser.
3. WHEN `mimeType` is `"application/vnd.openxmlformats-officedocument.wordprocessingml.document"`, THE Unified_Parser SHALL route the Buffer to the DOCX_Parser.
4. IF `mimeType` is any value other than the two supported types, THEN THE Unified_Parser SHALL return an error result without invoking any parser.
5. THE Unified_Parser SHALL NOT inspect file extension strings or attempt to infer format from the file buffer's binary signature.

---

### Requirement 7: PDF Text Extraction

**User Story:** As a user, I want my PDF resume's text to be accurately extracted so that the AI Analysis Pipeline has the full content to analyze.

#### Acceptance Criteria

1. WHEN the PDF_Parser receives a Buffer containing a text-based PDF file, THE PDF_Parser SHALL extract all readable text from all pages of the document.
2. THE PDF_Parser SHALL use the `pdf-parse` library (to be installed) to perform text extraction from the Buffer.
3. WHEN parsing a multi-page PDF, THE PDF_Parser SHALL extract and concatenate text from all pages in document order.
4. IF the Buffer is a valid PDF but contains no extractable text (e.g. a scanned image-only PDF), THE PDF_Parser SHALL return an empty string as the extracted text and SHALL NOT treat this as a parse error.
5. IF the Buffer cannot be parsed as a valid PDF (corrupted file, password-protected PDF, or invalid format), THEN THE PDF_Parser SHALL return an error result with a descriptive message.
6. THE PDF_Parser SHALL NOT perform OCR on image-only pages; optical character recognition is out of scope.
7. THE PDF_Parser SHALL return the raw text string and the page count from `pdf-parse`'s result for use in ParseResult construction.

---

### Requirement 8: DOCX Text Extraction

**User Story:** As a user, I want my DOCX resume's text to be accurately extracted including all content sections so that the AI Analysis Pipeline has the full content to analyze.

#### Acceptance Criteria

1. WHEN the DOCX_Parser receives a Buffer containing a valid DOCX file, THE DOCX_Parser SHALL extract plain text from all paragraphs, headings, and list items in the document.
2. THE DOCX_Parser SHALL use the `mammoth` library (to be installed) to perform text extraction from the Buffer.
3. WHEN parsing a DOCX file containing table content, THE DOCX_Parser SHALL extract text from table cells using `mammoth`'s default behavior and SHALL document that table structure (column/row relationships) is not preserved in the extracted text.
4. WHEN parsing a multi-section DOCX file, THE DOCX_Parser SHALL extract text from all sections in document order.
5. IF the Buffer cannot be parsed as a valid DOCX (corrupted file or invalid format), THEN THE DOCX_Parser SHALL return an error result with a descriptive message.
6. THE DOCX_Parser SHALL use `mammoth.extractRawText({ buffer })` to obtain plain text and SHALL NOT use `mammoth.convertToHtml` for the primary text extraction path.

---

### Requirement 9: Text Normalization

**User Story:** As an engineer, I want the extracted text to be normalized before persistence, so that the AI Analysis Pipeline receives clean, consistent input rather than raw parser output with encoding artifacts.

#### Acceptance Criteria

1. WHEN raw text is returned by the PDF_Parser or DOCX_Parser, THE Text_Normalizer SHALL process it before it is stored or returned.
2. THE Text_Normalizer SHALL collapse sequences of two or more consecutive blank lines into a single blank line.
3. THE Text_Normalizer SHALL collapse sequences of two or more consecutive space or tab characters within a single line into a single space character.
4. THE Text_Normalizer SHALL remove null bytes (`\u0000`) and other non-printable control characters (Unicode categories `Cc` excluding `\n`, `\r`, and `\t`) from the extracted text.
5. THE Text_Normalizer SHALL trim leading and trailing whitespace from the final normalized string.
6. THE Text_Normalizer SHALL preserve intentional line breaks (`\n`) that separate resume sections, bullet points, and paragraphs.
7. IF the normalized text is an empty string after all processing, THE Text_Normalizer SHALL return an empty string; the caller (Parse_API) SHALL record this as a successful parse with zero words and zero characters.

---

### Requirement 10: Extracted Text Persistence

**User Story:** As an engineer, I want the extracted text and parsing metadata to be stored in a dedicated table, so that the AI Analysis Pipeline can read clean resume content without re-parsing, and so that parsing results can be versioned.

#### Acceptance Criteria

1. WHEN parsing and normalization succeed, THE Parse_API SHALL insert a Resume_Content_Record into the `resume_contents` table with the fields: `id` (generated UUID), `resumeId` (the Resume_ID), `userId` (the Clerk_User_ID), `extractedText` (the normalized Extracted_Text string), `wordCount` (the count of whitespace-separated tokens in the normalized text), `charCount` (the character length of the normalized text), `parserVersion` (the Parser_Version string), and `parsedAt` (the current UTC timestamp).
2. IF a Resume_Content_Record already exists for the given `resumeId`, THE Parse_API SHALL replace it (upsert on `resumeId`) with the new extracted text and updated metadata.
3. THE Parse_API SHALL perform the `resume_contents` insert/upsert and the `resumes.status` update to `"parsed"` within a single database transaction, so that both operations succeed or both are rolled back.
4. IF the database write fails, THE Parse_API SHALL transition the Resume_Record's status to `"failed"`, record the error, and return an HTTP 500 response.
5. THE Parse_API SHALL store the Clerk_User_ID directly in `resume_contents.user_id` without any intermediate lookup.

---

### Requirement 11: API Response Contract

**User Story:** As a client developer, I want the parse API to return consistent, predictable responses, so that callers can reliably handle success and error states.

#### Acceptance Criteria

1. WHEN parsing and persistence succeed, THE Parse_API SHALL return an HTTP 200 response with a JSON body containing: `"resumeId"` (the Resume_ID string), `"status"` (the string `"parsed"`), `"wordCount"` (integer), `"charCount"` (integer), and `"parserVersion"` (string).
2. WHEN a request is rejected due to missing authentication, THE Parse_API SHALL return an HTTP 401 response with a JSON body containing an `"error"` field with a human-readable message.
3. WHEN a request is rejected due to resume not found, THE Parse_API SHALL return an HTTP 404 response with a JSON body containing an `"error"` field.
4. WHEN a request is rejected due to ownership mismatch, THE Parse_API SHALL return an HTTP 403 response with a JSON body containing an `"error"` field.
5. WHEN a request is rejected because the resume is already being processed or has already been parsed or analyzed, THE Parse_API SHALL return an HTTP 409 response with a JSON body containing an `"error"` field.
6. WHEN a request fails due to a storage download, parsing, or database error, THE Parse_API SHALL return an HTTP 500 response with a JSON body containing an `"error"` field with a human-readable message.
7. THE Parse_API SHALL return all responses as JSON with a `Content-Type` of `"application/json"`.
8. THE Parse_API SHALL NOT expose internal stack traces, raw library error objects, or Supabase error internals in any response body returned to the client.

---

### Requirement 12: Error Atomicity and Status Consistency

**User Story:** As an engineer, I want the system to maintain consistent state between `resumes.status` and `resume_contents` at all times, so that a failed parse never leaves the system in a partially-written state.

#### Acceptance Criteria

1. THE Parse_API SHALL transition the Resume_Record's status to `"processing"` before any file download or parsing begins, so that concurrent requests for the same resume are rejected at the status pre-check.
2. IF any step between status → `"processing"` and the final database write fails, THE Parse_API SHALL transition the Resume_Record's status from `"processing"` to `"failed"` and SHALL persist a human-readable error message.
3. THE Parse_API SHALL NOT leave a Resume_Record in `"processing"` status indefinitely; every code path that enters `"processing"` MUST exit to either `"parsed"` or `"failed"`.
4. THE Parse_API SHALL NOT insert a Resume_Content_Record when parsing fails; partial text results SHALL NOT be persisted.
5. WHEN the Parse_API transitions status to `"failed"`, THE Parse_API SHALL record the failure reason to enable debugging and retry decisions.

---

### Requirement 13: Security and Credential Isolation

**User Story:** As a security-conscious engineer, I want all file access and parsing to remain server-side, so that resume content and Supabase service credentials are never exposed to any client.

#### Acceptance Criteria

1. THE Parse_API SHALL perform all Clerk authentication, Supabase Storage downloads, text parsing, and database writes exclusively within the Next.js Route Handler, which runs in the Node.js server environment.
2. THE Parse_API SHALL use the Service_Client (initialized with `SUPABASE_SERVICE_ROLE_KEY`) for the file download and SHALL NOT use the Anon_Client or generate signed URLs for internal server-side parsing operations.
3. THE Parse_API SHALL NOT return any portion of the Extracted_Text in any HTTP response body; the parsed text is persisted to the database for use by the AI Analysis Pipeline, not returned to callers.
4. THE Parse_API SHALL NOT introduce any new environment variables beyond those already defined in the project.
5. THE PDF_Parser and DOCX_Parser SHALL operate purely on in-memory `Buffer` objects; they SHALL NOT write temporary files to disk.

---

### Requirement 14: Node.js Runtime Constraint

**User Story:** As an engineer, I want the parsing libraries to run in the Next.js Node.js runtime, so that there are no compatibility issues with edge runtime restrictions.

#### Acceptance Criteria

1. THE Parse_API route file SHALL export `export const runtime = "nodejs"` to explicitly declare the Node.js runtime and prevent Next.js from attempting to run this route on the edge runtime.
2. THE PDF_Parser SHALL use a library that operates on `Buffer` objects and does not require native binary add-ons that could fail in a serverless Node.js environment.
3. THE DOCX_Parser SHALL use a library that operates on `Buffer` objects and does not require native binary add-ons that could fail in a serverless Node.js environment.

---

## Out of Scope

The following capabilities are explicitly excluded from the Resume Parsing Pipeline and must not be designed or implemented as part of this feature:

- **AI / LLM analysis**: Sending Extracted_Text to OpenAI or any other language model for scoring, feedback, or structured output.
- **ATS scoring**: Computing applicant-tracking-system compatibility scores.
- **Resume listing, deletion, or retrieval endpoints**: No new CRUD endpoints for the `resumes` table beyond the parse endpoint.
- **Job description matching**: No logic that compares resume content to a job description.
- **OCR for scanned PDFs**: Optical character recognition is not in scope; scanned image-only PDFs result in empty extracted text, which is handled gracefully as a zero-word parse.
- **Frontend UI for triggering parsing**: The Parse_API is a backend endpoint. No browser-facing component is created in this feature.
- **Frontend display of parsed text**: The Extracted_Text is not rendered in any UI component.
- **Re-parse endpoints**: A dedicated "force re-parse" flow is not in scope; however, the `"failed"` → parse retry path is supported by the status pre-check (Requirement 3.4).
- **Virus or malware scanning**: Inspecting uploaded file content for malicious payloads is not in scope.
- **Rate limiting**: Throttling parse requests per user or per IP is not in scope.
- **Schema rollback migrations**: Only the forward migration to add `"parsed"` and `resume_contents` is in scope.
