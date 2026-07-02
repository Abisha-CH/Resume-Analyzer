"use client";

import { useState, useRef, useCallback } from "react";

export type UploadState = "idle" | "dragging" | "selected" | "uploading" | "error";

export interface UseFileUploadOptions {
  /** Accepted file extensions e.g. [".pdf", ".docx"] */
  accept?: string[];
  /** Max file size in bytes. Default: 5MB */
  maxSize?: number;
}

export interface UseFileUploadReturn {
  state: UploadState;
  file: File | null;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleFile: (file: File) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearFile: () => void;
}

const DEFAULT_ACCEPT = [".pdf", ".docx"];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function useFileUpload({
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(
    (incoming: File) => {
      setError(null);
      const ext = "." + incoming.name.split(".").pop()?.toLowerCase();
      if (!accept.includes(ext)) {
        setError(`Unsupported format. Please upload ${accept.join(" or ")}.`);
        setState("error");
        return;
      }
      if (incoming.size > maxSize) {
        setError(`File is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)} MB.`);
        setState("error");
        return;
      }
      setFile(incoming);
      setState("selected");
    },
    [accept, maxSize]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState((prev) => (prev === "selected" ? "selected" : "dragging"));
  }, []);

  const handleDragLeave = useCallback(() => {
    setState((prev) => (prev === "dragging" ? "idle" : prev));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
      else setState("idle");
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
    },
    [handleFile]
  );

  const clearFile = useCallback(() => {
    setFile(null);
    setError(null);
    setState("idle");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return {
    state,
    file,
    error,
    inputRef,
    handleFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
    clearFile,
  };
}
