import ResumeUploader from "@/components/upload/resume-uploader";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Resume</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Upload your resume to receive an instant AI-powered ATS analysis.
        </p>
      </div>
      <ResumeUploader />
    </div>
  );
}
