import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import type { StorageAdapter, StorageFile, StorageUploadResult } from './StorageAdapter';
import { logger } from '../lib/logger';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

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
  constructor(private readonly baseUrl: string) {}

  async upload(file: StorageFile): Promise<StorageUploadResult> {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const ext = path.extname(file.originalname) || this.mimeToExt(file.mimetype);
    const filename = `${nanoid()}${ext}`;
    const destPath = path.join(UPLOADS_DIR, filename);

    fs.renameSync(file.tmpPath, destPath);

    const url = `${this.baseUrl.replace(/\/$/, '')}/uploads/${filename}`;
    logger.debug({ key: filename, url }, 'Screenshot saved to local storage');

    return { url, key: filename };
  }

  private mimeToExt(mimetype: string): string {
    const map: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    return map[mimetype] ?? '.bin';
  }
}
