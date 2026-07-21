# Implementation Plan: Resume Upload Pipeline

## Overview

Implement the full-stack resume upload pipeline by: (1) creating the Upload_API Route Handler that validates, stores, and records resume files; (2) creating the Upload_UI client component with a discriminated-union state machine and drag-and-drop support; and (3) wiring the upload page to render the new component. All sensitive I/O remains server-side; the client only sends a `multipart/form-data` POST and renders state feedback.

---

## Tasks

- [x] 1. Create the Upload_API Route Handler
  - [x] 1.1 Scaffold `app/api/resumes/upload/route.ts` with auth, validation, and response stubs
    - Create the file exporting an async `POST(request: Request)` function
    - Add `import { auth } from "@clerk/nextjs/server"` and return 401 when `userId` is null
    - Define the `ALLOWED_MIME` constant and `MAX_BYTES = 5_242_880` constant at module level
    - Parse `request.formData()`, extract the `"file"` field, and return 422 `{ error: "No file provided." }` when absent
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1–2.7, 6.2, 6.3, 6.5, 6.6, 10.1, 10.3_

  - [x] 1.2 Add file validation steps (MIME type, extension, size) inside the route handler
    - Implement MIME type check: reject with 422 naming the received type and accepted types (Requirements 2.1, 2.4)
    - Implement extension check: `file.name.split(".").pop()?.toLowerCase()`, reject with 422 (Requirements 2.2, 2.5)
    - Implement size check: reject with 422 stating max and actual bytes (Requirements 2.3, 2.6)
    - Ensure all three validations run before any I/O (Requirement 2.7)
    - _Requirements: 2.1–2.7, 6.3, 6.5, 6.6_

  - [ ]* 1.3 Write property tests for validation logic (Properties 1–3)
    - **Property 1: Any non-allowlisted MIME type is rejected before I/O**
    - **Validates: Requirements 2.1, 2.4, 2.7**
    - **Property 2: Any non-allowlisted file extension is rejected before I/O**
    - **Validates: Requirements 2.2, 2.5, 2.7**
    - **Property 3: Any file exceeding the size limit is rejected before I/O**
    - **Validates: Requirements 2.3, 2.6, 2.7**
    - Use `fast-check` to generate arbitrary MIME strings, filenames, and file sizes; mock `uploadResume`, `deleteResume`, `db.insert`, and `auth`
    - Assert no call to `uploadResume()` or `db.insert()` is made, and HTTP status is 422
    - _Requirements: 2.1–2.7_

  - [x] 1.4 Add Resume_ID generation, buffer extraction, and storage upload step
    - Generate `resumeId` via `crypto.randomUUID()` (Node.js built-in; no import needed in Next.js 15) after validation passes (Requirement 3.1–3.3)
    - Extract buffer: `const buffer = Buffer.from(await file.arrayBuffer())`
    - Call `uploadResume(userId, resumeId, buffer, file.type)` imported from `@/lib/supabase/storage`
    - On `success: false`: detect bucket-not-found message and return 500 with operator instruction; otherwise return 500 with generic upload failure message (Requirements 4.5, 4.6)
    - On `success: true`: destructure `path` as `storagePath`; discard `url` (Option B — `storageUrl` is `null`)
    - _Requirements: 3.1–3.3, 4.1–4.7, 6.4, 10.1, 10.3, 10.4_

  - [ ]* 1.5 Write property test for storage-failure invariant (Property 4)
    - **Property 4: No database write occurs without a confirmed storage write**
    - **Validates: Requirements 4.6, 5.6, 11.3, 11.4**
    - Generate arbitrary storage error strings; mock `uploadResume` to return `{ success: false, error }`
    - Assert `db.insert` is never called and response status is 500
    - _Requirements: 4.6, 5.6, 11.3, 11.4_

  - [x] 1.6 Add DB insert step with best-effort cleanup on failure
    - Import `db` and `resumes` from `@/db`
    - Call `db.insert(resumes).values({ id: resumeId, userId, originalName: file.name, storagePath, storageUrl: null, mimeType: file.type, sizeBytes: file.size, status: "pending" })` inside a `try/catch`
    - In the `catch`: call `deleteResume(storagePath).catch(err => console.error("[upload] Cleanup deleteResume failed:", err))` — fire-and-forget (Requirements 5.4, 11.1, 11.2)
    - In the `catch`: return 500 `{ error: "Failed to save resume record. Please try again." }` regardless of cleanup outcome (Requirement 5.5)
    - On success: return `Response.json({ resumeId, storagePath, status: "pending" }, { status: 201 })` (Requirement 6.1)
    - _Requirements: 5.1–5.6, 6.1, 6.4, 11.1–11.4_

  - [ ]* 1.7 Write property tests for DB-failure cleanup and 201 response shape (Properties 5–7)
    - **Property 5: Storage cleanup is attempted on every database insert failure**
    - **Validates: Requirements 5.4, 11.1, 11.2**
    - **Property 6: The 201 response contains correct, consistent fields for any valid upload**
    - **Validates: Requirements 3.1, 3.2, 4.2, 6.1**
    - **Property 7: The inserted Resume_Record contains all required fields for any valid upload**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - For Property 5: mock `uploadResume` to succeed, `db.insert` to throw arbitrary errors; assert `deleteResume` is called with the exact `storagePath` returned by `uploadResume`
    - For Properties 6–7: generate arbitrary valid `(userId, file)` combinations; assert response body fields and captured `db.insert` argument
    - _Requirements: 3.1, 3.2, 4.2, 5.1–5.4, 6.1, 11.1–11.4_

- [x] 2. Checkpoint — API route complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create the Upload_UI Client Component
  - [x] 3.1 Scaffold `components/upload/resume-uploader.tsx` with state model and hidden file input
    - Add `"use client"` directive at the top of the file
    - Define `UploadState` discriminated union type matching the five phases: `idle | selected | uploading | success | error`
    - Initialise `const [state, setState] = useState<UploadState>({ phase: "idle" })` and `const [isDragOver, setIsDragOver] = useState(false)`
    - Declare `const fileInputRef = useRef<HTMLInputElement>(null)`
    - Render a `<input type="file" ref={fileInputRef} accept=".pdf,.docx" className="sr-only" aria-hidden="true" onChange={...} />` element
    - _Requirements: 7.1, 8.7, 10.2_

  - [x] 3.2 Implement `handleFileSelected` client-side pre-validation and state transitions
    - Define `ALLOWED_MIME_TYPES` and `MAX_BYTES` constants local to the file
    - In `handleFileSelected(file: File)`: check MIME type, then extension, then size; on any failure call `setState({ phase: "error", file: null, message: "<descriptive message>" })` (Requirements 9.1–9.4)
    - On all-pass: call `setState({ phase: "selected", file })`
    - Wire `fileInputRef`'s `onChange` to call `handleFileSelected(e.target.files?.[0])`
    - _Requirements: 7.4, 9.1–9.5, 8.6_

  - [x] 3.3 Implement drag-and-drop event handlers on the drop zone
    - Attach `onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}` on the drop zone `div`
    - Attach `onDragEnter={() => setIsDragOver(true)}` and `onDragLeave={() => setIsDragOver(false)}`
    - Attach `onDrop={e => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelected(f) }}`
    - Add `tabIndex={0}`, `role="region"`, `aria-label="Resume upload drop zone"`, and `onKeyDown` (Enter/Space triggers `fileInputRef.current?.click()`) for keyboard accessibility
    - _Requirements: 7.2, 7.3_

  - [x] 3.4 Implement `handleUpload` function that POSTs to the Upload_API
    - Guard: only callable when `state.phase === "selected"`
    - Build `FormData`: `const fd = new FormData(); fd.append("file", state.file)` (Requirement 8.1)
    - Call `setState({ phase: "uploading", file: state.file })` before the `fetch` (Requirement 8.2, 8.3)
    - Await `fetch("/api/resumes/upload", { method: "POST", body: fd })` — do NOT set `Content-Type` manually
    - On `res.ok`: `setState({ phase: "success", file, resumeId: json.resumeId, storagePath: json.storagePath })` (Requirement 8.4)
    - On non-ok: `setState({ phase: "error", file, message: json.error ?? "Upload failed. Please try again." })` (Requirement 8.5)
    - _Requirements: 8.1–8.5, 10.2_

  - [x] 3.5 Implement per-state JSX rendering preserving all existing design tokens
    - **idle state**: drop zone with `Upload` icon + "Drag & drop your resume here" + "PDF or DOCX · Max 5 MB" subtext + "Browse Files" button (preserves all tokens from existing static placeholder: `rounded-2xl border border-border bg-surface p-6 shadow-sm`, `rounded-xl border-2 border-dashed border-border bg-surface-subtle`, `bg-primary-light ring-1 ring-primary-muted`, `text-primary`, `bg-primary text-white hover:bg-primary-hover`)
    - **selected state**: `FileText` icon + filename + formatted file size + "Upload Resume" primary button + "Choose different file" ghost button; auto-focus the Upload button after file selection (Requirement 7.4)
    - **uploading state**: spinner + "Uploading…" + filename; button disabled + `aria-busy="true"`; drop zone `pointer-events-none opacity-50` (Requirements 8.2, 8.3)
    - **success state**: `CheckCircle` icon with `text-success bg-success-light` + filename + "Successfully uploaded" + `role="status"` wrapper + "Upload another resume" button that calls `setState({ phase: "idle" })` (Requirement 8.4, 8.7)
    - **error state**: `AlertCircle` icon with `text-error bg-error-light` + error message in `<p role="alert">` + "Try again" button that calls `setState({ phase: "idle" })` (Requirements 8.5, 8.6, 8.7)
    - Apply `ring-2 ring-primary bg-primary-light` on drop zone when `isDragOver` is true
    - Replace the "Coming soon" notice `<div>` with nothing (it's a static placeholder artefact)
    - _Requirements: 7.1, 7.5, 8.2–8.7, 9.4_

  - [ ]* 3.6 Write property test for client pre-validation guard (Property 8)
    - **Property 8: Client pre-validation blocks any invalid file from reaching the Upload_API**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
    - Generate arbitrary `File`-like objects with invalid MIME type, extension, or size using fast-check
    - Assert that `fetch` is never called after `handleFileSelected` resolves with an invalid file
    - Assert `state.phase === "error"` and `state.message` is non-empty
    - _Requirements: 9.1–9.5_

- [x] 4. Checkpoint — UI component complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Wire the upload page and integration
  - [x] 5.1 Update `app/(dashboard)/upload/page.tsx` to import and render `<ResumeUploader />`
    - Remove all inline JSX (static placeholder markup, `Upload`/`FileText`/`Info` icon imports, "Coming soon" notice)
    - Add `import ResumeUploader from "@/components/upload/resume-uploader"` (server component — no `"use client"` needed on this file)
    - Replace the page body with `<ResumeUploader />` wrapped in the existing outer `<div className="mx-auto max-w-2xl space-y-8">` container
    - Keep the page-level `<h1>` and subtitle `<p>` above the component for SEO and breadcrumb consistency — OR move them inside `ResumeUploader`'s idle state; choose whichever keeps the container padding intact
    - _Requirements: 7.1, 7.5_

  - [ ]* 5.2 Write integration tests for the full upload flow
    - Test: valid authenticated upload creates a `resumes` row with `status: "pending"` and `storage_url: null`, and the object exists in the `"resumes"` bucket at `{userId}/{resumeId}.{ext}`
    - Test: `storagePath` in the DB row matches the key in Supabase Storage
    - Test: unauthenticated request returns 401
    - Use a real or emulated Supabase test project; clean up inserted rows and storage objects after each test
    - _Requirements: 1.1, 4.1, 5.1, 5.2_

- [x] 6. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all core implementation tasks (unmarked) are required.
- `storageUrl` is **deliberately `null`** at insert time (Option B). The 1-hour signed URL returned by `uploadResume()` is used only to confirm the storage write succeeded; it is discarded before the DB insert.
- `crypto.randomUUID()` is used for Resume_ID generation — no new npm dependency.
- The `"file"` FormData field name is the strict contract between Upload_UI and Upload_API; never set `Content-Type` manually on the `fetch` call.
- All server-only modules (`lib/supabase/storage.ts`, `lib/supabase/server.ts`, `db/index.ts`) are imported exclusively inside the Route Handler — never inside `resume-uploader.tsx`.
- `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix and will never appear in client bundles; no new env vars are introduced.
- The upload page remains a **Server Component**; only `ResumeUploader` carries `"use client"`. Next.js handles the boundary automatically.
- The existing outer `<div className="mx-auto max-w-2xl space-y-8">` container in the upload page should be preserved (or moved into the component) so padding and layout remain consistent.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "3.2"] },
    { "id": 2, "tasks": ["1.3", "3.3"] },
    { "id": 3, "tasks": ["1.4", "3.4"] },
    { "id": 4, "tasks": ["1.5", "3.5"] },
    { "id": 5, "tasks": ["1.6", "3.6"] },
    { "id": 6, "tasks": ["1.7", "5.1"] },
    { "id": 7, "tasks": ["5.2"] }
  ]
}
```
