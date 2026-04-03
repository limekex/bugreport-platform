import { logger } from '../lib/logger';

export interface ScreenshotUploadResult {
  /** Public URL to the stored screenshot, if available */
  url: string | null;
}

/**
 * Uploads a screenshot file to the configured storage provider.
 *
 * TODO: Implement real S3/R2 upload logic.
 *       For now this is a placeholder that logs the file path and returns null.
 */
export async function uploadScreenshot(
  filePath: string,
  _mimetype: string,
): Promise<ScreenshotUploadResult> {
  // TODO: Switch on config.storage.provider and upload to S3/R2/local CDN.
  logger.warn({ filePath }, 'Screenshot upload is not yet implemented (placeholder)');
  return { url: null };
}
