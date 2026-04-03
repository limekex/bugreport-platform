import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Mock AWS SDK before importing the adapter
const mockSend = vi.fn();
const mockGetSignedUrl = vi.fn().mockResolvedValue('https://signed.example.com/screenshots/test.png?X-Amz-Signature=abc');

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: vi.fn().mockImplementation((params) => ({ _type: 'PutObject', ...params })),
  GetObjectCommand: vi.fn().mockImplementation((params) => ({ _type: 'GetObject', ...params })),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

describe('CloudStorageAdapter', () => {
  let tmpFile: string;

  beforeEach(async () => {
    mockSend.mockResolvedValue({});
    mockGetSignedUrl.mockResolvedValue('https://signed.example.com/screenshots/test.png?sig=abc');

    // Create a real temp file so the adapter can read + delete it
    tmpFile = path.join(os.tmpdir(), `bugreport-test-${Date.now()}.png`);
    fs.writeFileSync(tmpFile, Buffer.from('fake-png-data'));
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('uploads the file to S3 using PutObjectCommand', async () => {
    const { CloudStorageAdapter } = await import('../src/storage/CloudStorageAdapter');

    const adapter = new CloudStorageAdapter({
      bucket: 'test-bucket',
      region: 'eu-north-1',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
      publicUrlBase: 'https://cdn.example.com',
    });

    const result = await adapter.upload({
      tmpPath: tmpFile,
      mimetype: 'image/png',
      originalname: 'screenshot.png',
    });

    expect(mockSend).toHaveBeenCalledOnce();
    expect(result.url).toMatch(/^https:\/\/cdn\.example\.com\/screenshots\//);
    expect(result.key).toMatch(/^screenshots\/.+\.png$/);
  });

  it('returns a public URL when publicUrlBase is set', async () => {
    const { CloudStorageAdapter } = await import('../src/storage/CloudStorageAdapter');

    // Need a new temp file since the previous test deleted it
    const tmpFile2 = path.join(os.tmpdir(), `bugreport-test2-${Date.now()}.png`);
    fs.writeFileSync(tmpFile2, Buffer.from('fake-png-data-2'));

    const adapter = new CloudStorageAdapter({
      bucket: 'my-bucket',
      region: 'us-east-1',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      publicUrlBase: 'https://cdn.example.com',
    });

    const result = await adapter.upload({
      tmpPath: tmpFile2,
      mimetype: 'image/jpeg',
      originalname: 'photo.jpg',
    });

    expect(result.url).toMatch(/^https:\/\/cdn\.example\.com\/screenshots\//);
    expect(result.url).toMatch(/\.jpg$/);

    if (fs.existsSync(tmpFile2)) fs.unlinkSync(tmpFile2);
  });

  it('generates a signed URL when publicUrlBase is not set', async () => {
    const { CloudStorageAdapter } = await import('../src/storage/CloudStorageAdapter');

    const tmpFile3 = path.join(os.tmpdir(), `bugreport-test3-${Date.now()}.png`);
    fs.writeFileSync(tmpFile3, Buffer.from('fake-png-data-3'));

    const adapter = new CloudStorageAdapter({
      bucket: 'private-bucket',
      region: 'eu-central-1',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      // No publicUrlBase → should use signed URL
    });

    const result = await adapter.upload({
      tmpPath: tmpFile3,
      mimetype: 'image/png',
      originalname: 'private.png',
    });

    expect(mockGetSignedUrl).toHaveBeenCalledOnce();
    expect(result.url).toContain('signed.example.com');

    if (fs.existsSync(tmpFile3)) fs.unlinkSync(tmpFile3);
  });

  it('deletes the temp file after upload', async () => {
    const { CloudStorageAdapter } = await import('../src/storage/CloudStorageAdapter');

    const tmpFile4 = path.join(os.tmpdir(), `bugreport-test4-${Date.now()}.png`);
    fs.writeFileSync(tmpFile4, Buffer.from('data'));

    const adapter = new CloudStorageAdapter({
      bucket: 'test-bucket',
      region: 'eu-north-1',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      publicUrlBase: 'https://cdn.example.com',
    });

    await adapter.upload({
      tmpPath: tmpFile4,
      mimetype: 'image/png',
      originalname: 'temp.png',
    });

    expect(fs.existsSync(tmpFile4)).toBe(false);
  });
});
