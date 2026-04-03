import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

// Mock the GitHub service so tests never make real network calls
vi.mock('../src/services/github.service', () => ({
  createGitHubIssue: vi.fn().mockResolvedValue({
    issueNumber: 77,
    issueUrl: 'https://github.com/test-org/test-repo/issues/77',
  }),
}));

// Mock the storage service so tests never touch the filesystem
vi.mock('../src/services/storage.service', () => ({
  uploadScreenshot: vi.fn().mockResolvedValue({ url: null }),
}));

const app = createApp();

const validPayload = {
  summary: 'Login button does nothing on the login page',
  severity: 'high',
  whatHappened: 'Clicking the login button does absolutely nothing visible.',
  expectedResult: 'User should be redirected to the dashboard.',
  actualResult: 'Nothing happens, no error shown.',
  stepsToReproduce: '1. Open /login\n2. Enter valid credentials\n3. Click Login',
  environment: 'staging',
};

describe('POST /api/reports/bug — success path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 201 with issue number and URL for a valid payload', async () => {
    const res = await request(app)
      .post('/api/reports/bug')
      .field('summary', validPayload.summary)
      .field('severity', validPayload.severity)
      .field('whatHappened', validPayload.whatHappened)
      .field('expectedResult', validPayload.expectedResult)
      .field('actualResult', validPayload.actualResult)
      .field('stepsToReproduce', validPayload.stepsToReproduce)
      .field('environment', validPayload.environment);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.githubIssueNumber).toBe(77);
    expect(res.body.githubIssueUrl).toBe('https://github.com/test-org/test-repo/issues/77');
    expect(typeof res.body.reportId).toBe('string');
    expect(res.body.message).toMatch(/GitHub issue/i);
  });
});

describe('POST /api/reports/bug — validation rejections', () => {
  it('returns 400 when summary is too short', async () => {
    const res = await request(app)
      .post('/api/reports/bug')
      .field('summary', 'bug')
      .field('severity', 'high')
      .field('whatHappened', validPayload.whatHappened)
      .field('expectedResult', validPayload.expectedResult)
      .field('actualResult', validPayload.actualResult)
      .field('stepsToReproduce', validPayload.stepsToReproduce)
      .field('environment', validPayload.environment);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 when required fields are absent', async () => {
    const res = await request(app)
      .post('/api/reports/bug')
      .field('summary', validPayload.summary);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for an invalid severity value', async () => {
    const res = await request(app)
      .post('/api/reports/bug')
      .field('summary', validPayload.summary)
      .field('severity', 'critical')
      .field('whatHappened', validPayload.whatHappened)
      .field('expectedResult', validPayload.expectedResult)
      .field('actualResult', validPayload.actualResult)
      .field('stepsToReproduce', validPayload.stepsToReproduce)
      .field('environment', validPayload.environment);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
});

describe('POST /api/reports/bug — upload rejection', () => {
  it('returns 400 when an unsupported file type is uploaded', async () => {
    const res = await request(app)
      .post('/api/reports/bug')
      .field('summary', validPayload.summary)
      .field('severity', validPayload.severity)
      .field('whatHappened', validPayload.whatHappened)
      .field('expectedResult', validPayload.expectedResult)
      .field('actualResult', validPayload.actualResult)
      .field('stepsToReproduce', validPayload.stepsToReproduce)
      .field('environment', validPayload.environment)
      .attach('screenshot', Buffer.from('fake pdf content'), {
        filename: 'file.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
