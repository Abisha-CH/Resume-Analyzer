# API Routes

This directory will contain Next.js App Router API route handlers.

## Planned endpoints (Phase 2+)

- `POST /api/resume/analyze` — Upload resume + trigger OpenAI analysis
- `GET  /api/resume/[id]` — Fetch a stored analysis report
- `DELETE /api/resume/[id]` — Delete a stored resume
- `POST /api/auth/webhook` — Clerk webhook handler

All routes will use Supabase for storage and OpenAI for analysis.
