import { auth } from "@clerk/nextjs/server";
import { uploadResume, deleteResume } from "@/lib/supabase/storage";
import { db } from "@/db";
import { resumes } from "@/db/schema";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_BYTES = 5_242_880; // 5 MB

// ---------------------------------------------------------------------------
// POST /api/resumes/upload
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // Step 1 — Authentication
  const { userId } = await auth();
  if (!userId) {
    return Response.json(
      { error: "Unauthorized. Please sign in to upload a resume." },
      { status: 401 }
    );
  }

  // Step 2 — Parse FormData and extract file
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "No file provided." }, { status: 422 });
  }

  // Step 3 — MIME type validation
  if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
    return Response.json(
      {
        error: `Unsupported file type "${file.type}". Accepted types: ${ALLOWED_MIME.join(", ")}`,
      },
      { status: 422 }
    );
  }

  // Step 4 — Extension validation
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["pdf", "docx"].includes(ext ?? "")) {
    return Response.json(
      {
        error: `Unsupported file extension ".${ext}". Accepted extensions: .pdf, .docx`,
      },
      { status: 422 }
    );
  }

  // Step 5 — Size validation
  if (file.size > MAX_BYTES) {
    return Response.json(
      {
        error: `File size ${file.size} bytes exceeds the 5 MB maximum (${MAX_BYTES} bytes).`,
      },
      { status: 422 }
    );
  }

  // Step 6 — Resume ID generation
  const resumeId = crypto.randomUUID();

  // Step 7 — Buffer extraction
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Step 8 — Storage upload
  const uploadResult = await uploadResume(userId, resumeId, buffer, file.type);
  if (!uploadResult.success) {
    if (
      uploadResult.error.includes("Bucket not found") ||
      uploadResult.error.includes("not found")
    ) {
      return Response.json(
        {
          error:
            'Storage bucket "resumes" not found. Create it in the Supabase Storage dashboard before uploading.',
        },
        { status: 500 }
      );
    }
    return Response.json(
      { error: `Storage upload failed: ${uploadResult.error}` },
      { status: 500 }
    );
  }

  const { path: storagePath } = uploadResult;
  // uploadResult.url (1-hour signed URL) is intentionally discarded — storageUrl stays null.
  // See design doc: Signed URL Lifecycle Decision — Option B.

  // Step 9 — Database insert
  try {
    await db.insert(resumes).values({
      id: resumeId,
      userId: userId,
      originalName: file.name,
      storagePath: storagePath,
      storageUrl: null,
      mimeType: file.type,
      sizeBytes: file.size,
      status: "pending",
    });
  } catch (dbError) {
    // Best-effort cleanup — fire and forget
    deleteResume(storagePath).catch((cleanupError) => {
      console.error("[upload] Cleanup deleteResume failed:", cleanupError);
    });
    console.error("[upload] DB insert failed:", dbError);
    return Response.json(
      { error: "Failed to save resume record. Please try again." },
      { status: 500 }
    );
  }

  // Step 10 — Success
  return Response.json(
    { resumeId, storagePath, status: "pending" },
    { status: 201 }
  );
}
