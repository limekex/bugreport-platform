import { config } from '../config';
import { logger } from '../lib/logger';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { LocalStorageAdapter } from '../storage/LocalStorageAdapter';
import { CloudStorageAdapter } from '../storage/CloudStorageAdapter';

export interface ScreenshotUploadResult {
  /** Public URL to the stored screenshot, or null if not publicly accessible */
  url: string | null;
}

function createAdapter(): StorageAdapter {
  switch (config.storage.provider) {
    case 'local':
      return new LocalStorageAdapter(`http://localhost:${config.port}`);
    case 's3':
    case 'r2':
      // TODO: Pass S3 config to CloudStorageAdapter once implemented
      return new CloudStorageAdapter();
    default:
      logger.warn({ provider: config.storage.provider }, 'Unknown storage provider, falling back to local');
      return new LocalStorageAdapter(`http://localhost:${config.port}`);
  }
}

const adapter: StorageAdapter = createAdapter();

/**
 * Uploads a screenshot file to the configured storage provider.
 *
 * Storage behaviour depends on the STORAGE_PROVIDER environment variable:
 * - `local` — saves to `uploads/` on the local filesystem (dev only)
 * - `s3` / `r2` — TODO: upload to S3-compatible object storage (see CloudStorageAdapter)
 */
export async function uploadScreenshot(
  filePath: string,
  mimetype: string,
  originalname: string,
): Promise<ScreenshotUploadResult> {
  const result = await adapter.upload({ tmpPath: filePath, mimetype, originalname });
  return { url: result.url };
}
