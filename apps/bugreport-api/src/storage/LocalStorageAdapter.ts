import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import type { StorageAdapter, StorageFile, StorageUploadResult } from './StorageAdapter';
import { logger } from '../lib/logger';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

/** Allowed upload extensions derived from supported MIME types only. */
const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/**
 * Local-disk storage adapter for development.
 *
 * Moves the multer temp file into `<cwd>/uploads/` with a randomised filename
 * and returns a URL relative to the API server (e.g. `http://localhost:3001/uploads/<file>`).
 *
 * The Express app serves the `uploads/` directory as `/uploads` when
 * `STORAGE_PROVIDER=local` (see app.ts).
 *
 * NOTE: This adapter is intentionally dev-only. Files are stored on the
 * local filesystem and are not persisted between deployments.
 * Replace with CloudStorageAdapter for production.
 */
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly baseUrl: string) {
    // Ensure the uploads directory exists once at startup rather than per-request.
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  async upload(file: StorageFile): Promise<StorageUploadResult> {
    // Derive extension from the validated MIME type only — never trust the
    // client-provided filename extension to avoid path injection.
    const ext = MIME_TO_EXT[file.mimetype] ?? '.bin';
    const filename = `${nanoid()}${ext}`;
    const destPath = path.resolve(UPLOADS_DIR, filename);

    // Safety check: ensure the resolved destination stays within UPLOADS_DIR
    if (!destPath.startsWith(UPLOADS_DIR + path.sep) && destPath !== UPLOADS_DIR) {
      throw new Error('Storage path traversal detected');
    }

    await fs.promises.rename(file.tmpPath, destPath);

    const url = `${this.baseUrl.replace(/\/$/, '')}/uploads/${filename}`;
    logger.debug({ key: filename, url }, 'Screenshot saved to local storage');

    return { url, key: filename };
  }
}
