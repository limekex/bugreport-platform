import type { StorageAdapter, StorageFile, StorageUploadResult } from './StorageAdapter';

/**
 * Cloud storage adapter — placeholder for S3 / Cloudflare R2 / Supabase Storage.
 *
 * TODO: Implement this adapter using the AWS SDK v3 (`@aws-sdk/client-s3`).
 *
 * Steps to implement:
 * 1. `pnpm add @aws-sdk/client-s3` in apps/bugreport-api
 * 2. Create an S3Client using `config.storage.{region,endpoint,accessKey,secretKey}`
 * 3. Read the temp file from `file.tmpPath`
 * 4. Upload using `PutObjectCommand` to `config.storage.bucket`
 * 5. Delete the temp file after upload
 * 6. Return the public URL (or a signed URL if the bucket is private)
 *
 * Cloudflare R2 is S3-compatible — set `STORAGE_ENDPOINT` to your R2 endpoint and
 * use the same code path.
 *
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/
 * @see https://developers.cloudflare.com/r2/api/s3/api/
 */
export class CloudStorageAdapter implements StorageAdapter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async upload(_file: StorageFile): Promise<StorageUploadResult> {
    throw new Error(
      'CloudStorageAdapter is not yet implemented. Set STORAGE_PROVIDER=local for development.',
    );
  }
}
