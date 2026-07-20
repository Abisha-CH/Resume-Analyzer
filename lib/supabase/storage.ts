/**
 * Supabase Storage helpers for resume file management.
 *
 * Bucket: "resumes"
 * Path convention: resumes/{userId}/{resumeId}.{ext}
 *
 * All uploads go through the service client so that server-side
 * code can write without relying on a user JWT.
 */
import { createServiceClient } from "./server";

const BUCKET = "resumes";

export type StorageUploadResult =
  | { success: true; path: string; url: string }
  | { success: false; error: string };

/**
 * Upload a resume buffer to Supabase Storage.
 * Returns the storage path and a signed URL valid for 1 hour.
 */
export async function uploadResume(
  userId: string,
  resumeId: string,
  buffer: Buffer,
  mimeType: string
): Promise<StorageUploadResult> {
  const ext = mimeType.includes("pdf") ? "pdf" : "docx";
  const path = `${userId}/${resumeId}.${ext}`;

  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60); // 1 hour

  if (signedError || !signedData) {
    return { success: false, error: signedError?.message ?? "Failed to sign URL" };
  }

  return { success: true, path, url: signedData.signedUrl };
}

/**
 * Generate a fresh signed URL for an existing resume.
 */
export async function getResumeSignedUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Delete a resume from storage (e.g. on account deletion).
 */
export async function deleteResume(path: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return !error;
}
