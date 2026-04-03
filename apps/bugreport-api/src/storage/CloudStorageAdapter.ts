import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { logger } from '../lib/logger';
import type { StorageAdapter, StorageFile, StorageUploadResult } from './StorageAdapter';

/** Allowed upload MIME types to extensions — only trusted types allowed */
const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export interface CloudStorageConfig {
  /** S3 bucket name */
  bucket: string;
  /** AWS region (e.g. "eu-north-1") */
  region: string;
  /** Custom endpoint URL for R2 / MinIO — leave empty for real AWS S3 */
  endpoint?: string;
  /** Access key ID */
  accessKeyId: string;
  /** Secret access key */
  secretAccessKey: string;
  /**
   * Base URL used to construct public object URLs.
   *
   * Examples:
   *  - AWS S3 public bucket: `https://<bucket>.s3.<region>.amazonaws.com`
   *  - Cloudflare R2 custom domain: `https://cdn.bugreport.betait.no`
   *  - MinIO: `http://localhost:9000/<bucket>`
   *
   * If empty, signed URLs are generated instead (see `signedUrlExpiresIn`).
   */
  publicUrlBase?: string;
  /**
   * When `publicUrlBase` is not set, generate a pre-signed GET URL valid for
   * this many seconds. Defaults to 7 days (604800 s).
   */
  signedUrlExpiresIn?: number;
}

/**
 * S3-compatible cloud storage adapter.
 *
 * Works with:
 * - AWS S3 (leave `endpoint` empty)
 * - Cloudflare R2 (set `endpoint` to your R2 S3-API endpoint)
 * - MinIO / any other S3-compatible service
 *
 * Configure via environment variables (see .env.example):
 *   STORAGE_PROVIDER=s3   (or r2)
 *   STORAGE_BUCKET=bugreport-screenshots
 *   STORAGE_REGION=eu-north-1
 *   STORAGE_ENDPOINT=https://<account>.r2.cloudflarestorage.com   # R2 only
 *   STORAGE_ACCESS_KEY=...
 *   STORAGE_SECRET_KEY=...
 *   STORAGE_PUBLIC_URL_BASE=https://cdn.bugreport.betait.no       # optional
 *   STORAGE_SIGNED_URL_EXPIRES=604800                             # optional (seconds)
 */
export class CloudStorageAdapter implements StorageAdapter {
  private readonly client: S3Client;
  private readonly config: Required<
    Pick<CloudStorageConfig, 'bucket' | 'region' | 'publicUrlBase' | 'signedUrlExpiresIn'>
  > & { endpoint: string | undefined };

  constructor(storageConfig: CloudStorageConfig) {
    this.config = {
      bucket: storageConfig.bucket,
      region: storageConfig.region,
      endpoint: storageConfig.endpoint || undefined,
      publicUrlBase: storageConfig.publicUrlBase ?? '',
      signedUrlExpiresIn: storageConfig.signedUrlExpiresIn ?? 604800,
    };

    this.client = new S3Client({
      region: storageConfig.region,
      endpoint: storageConfig.endpoint || undefined,
      credentials: {
        accessKeyId: storageConfig.accessKeyId,
        secretAccessKey: storageConfig.secretAccessKey,
      },
      // Required for Cloudflare R2 and other path-style S3-compatible services
      forcePathStyle: Boolean(storageConfig.endpoint),
    });
  }

  async upload(file: StorageFile): Promise<StorageUploadResult> {
    const ext = MIME_TO_EXT[file.mimetype] ?? '.bin';
    const key = `screenshots/${nanoid()}${ext}`;

    const fileBuffer = await fs.promises.readFile(file.tmpPath);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype,
        // Cache uploaded screenshots for 1 year — they are immutable (random key)
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    // Clean up the temp file after successful upload
    await fs.promises.unlink(file.tmpPath).catch((err: Error) => {
      logger.warn({ err, tmpPath: file.tmpPath }, 'Failed to delete temp file after S3 upload');
    });

    const url = await this.buildUrl(key);

    logger.info({ key, bucket: this.config.bucket, url }, 'Screenshot uploaded to cloud storage');

    return { url, key };
  }

  /**
   * Returns the URL for an uploaded object.
   *
   * If `publicUrlBase` is configured, returns a simple public URL.
   * Otherwise generates a pre-signed GET URL valid for `signedUrlExpiresIn` seconds.
   */
  private async buildUrl(key: string): Promise<string> {
    if (this.config.publicUrlBase) {
      const base = this.config.publicUrlBase.replace(/\/$/, '');
      return `${base}/${key}`;
    }

    // Generate a pre-signed URL for private buckets
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: this.config.signedUrlExpiresIn,
    });
  }
}
