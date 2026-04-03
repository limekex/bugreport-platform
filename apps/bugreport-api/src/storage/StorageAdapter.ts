/**
 * Minimal interface every storage adapter must implement.
 *
 * Implementations:
 * - LocalStorageAdapter — saves to the local `uploads/` directory (dev only)
 * - CloudStorageAdapter — placeholder for S3 / Cloudflare R2 / Supabase Storage
 */
export interface StorageAdapter {
  /**
   * Persist an uploaded file and return a public URL (or null if no public URL
   * is available in the current environment).
   */
  upload(file: StorageFile): Promise<StorageUploadResult>;
}

export interface StorageFile {
  /** Absolute path to the temp file written by multer */
  tmpPath: string;
  /** Original filename as provided by the client */
  originalname: string;
  /** Declared MIME type from the multipart headers */
  mimetype: string;
}

export interface StorageUploadResult {
  /** Public URL to access the stored file, or null if not publicly accessible */
  url: string | null;
  /** Internal storage key / path (useful for audit logging) */
  key: string;
}
