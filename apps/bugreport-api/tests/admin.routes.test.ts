import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

// Mock the domain mapping store so we don't touch the filesystem
vi.mock('../src/store/domainMappingStore', async (importOriginal) => {
  let mappings: Array<{
    id: string;
    origin: string;
    githubOwner: string;
    githubRepo: string;
    githubToken: string;
    defaultLabels: string[];
    createdAt: string;
    updatedAt: string;
  }> = [];

  return {
    initDomainMappingStore: vi.fn(),
    getAllowedOrigins: vi.fn(() => mappings.map((m) => m.origin)),
    getAllMappings: vi.fn(() => mappings),
    getMappingById: vi.fn((id: string) => mappings.find((m) => m.id === id)),
    getMappingByOrigin: vi.fn((origin: string) => mappings.find((m) => m.origin === origin)),
    createMapping: vi.fn((data: {
      origin: string;
      githubOwner: string;
      githubRepo: string;
      githubToken: string;
      defaultLabels: string[];
    }) => {
      const mapping = {
        id: 'test-id-' + mappings.length,
        ...data,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      mappings.push(mapping);
      return mapping;
    }),
    updateMapping: vi.fn((id: string, data: Record<string, unknown>) => {
      const idx = mappings.findIndex((m) => m.id === id);
      if (idx === -1) return undefined;
      mappings[idx] = { ...mappings[idx], ...data, updatedAt: new Date().toISOString() };
      return mappings[idx];
    }),
    deleteMapping: vi.fn((id: string) => {
      const idx = mappings.findIndex((m) => m.id === id);
      if (idx === -1) return false;
      mappings.splice(idx, 1);
      return true;
    }),
    _resetStore: vi.fn((initial: typeof mappings = []) => {
      mappings = initial;
    }),
  };
});

describe('Admin API — /api/admin/domains', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset the in-memory store
    const store = await import('../src/store/domainMappingStore');
    (store._resetStore as ReturnType<typeof vi.fn>)([]);

    // Set ADMIN_API_KEY for tests
    process.env.ADMIN_API_KEY = 'test-admin-key';
    // Re-import config to pick up env changes
    vi.resetModules();
  });

  // Need to recreate app after resetting modules
  function getApp() {
    return createApp();
  }

  it('returns 401 when no API key is provided', async () => {
    const res = await request(getApp()).get('/api/admin/domains');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when an invalid API key is provided', async () => {
    const res = await request(getApp())
      .get('/api/admin/domains')
      .set('x-api-key', 'wrong-key');
    expect(res.status).toBe(401);
  });

  it('lists domain mappings (empty)', async () => {
    const res = await request(getApp())
      .get('/api/admin/domains')
      .set('x-api-key', 'test-admin-key');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('creates a domain mapping', async () => {
    const res = await request(getApp())
      .post('/api/admin/domains')
      .set('x-api-key', 'test-admin-key')
      .send({
        origin: 'https://stage.myapp.com',
        githubOwner: 'my-org',
        githubRepo: 'my-repo',
        githubToken: 'ghp_test1234567890',
        defaultLabels: ['bug', 'stage'],
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.origin).toBe('https://stage.myapp.com');
    expect(res.body.data.githubOwner).toBe('my-org');
    // Token should be masked
    expect(res.body.data.githubToken).not.toBe('ghp_test1234567890');
    expect(res.body.data.githubToken).toContain('****');
  });

  it('rejects creation with invalid data', async () => {
    const res = await request(getApp())
      .post('/api/admin/domains')
      .set('x-api-key', 'test-admin-key')
      .send({
        origin: 'not-a-url',
        githubOwner: '',
        githubRepo: 'my-repo',
        githubToken: 'ghp_test',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('gets a single mapping by ID', async () => {
    // Create one first
    const createRes = await request(getApp())
      .post('/api/admin/domains')
      .set('x-api-key', 'test-admin-key')
      .send({
        origin: 'https://stage.example.com',
        githubOwner: 'org',
        githubRepo: 'repo',
        githubToken: 'ghp_longtoken123456',
        defaultLabels: ['bug'],
      });

    const id = createRes.body.data.id;

    const res = await request(getApp())
      .get(`/api/admin/domains/${id}`)
      .set('x-api-key', 'test-admin-key');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it('returns 404 for non-existent mapping', async () => {
    const res = await request(getApp())
      .get('/api/admin/domains/nonexistent')
      .set('x-api-key', 'test-admin-key');
    expect(res.status).toBe(404);
  });

  it('updates a mapping', async () => {
    // Create one first
    const createRes = await request(getApp())
      .post('/api/admin/domains')
      .set('x-api-key', 'test-admin-key')
      .send({
        origin: 'https://stage.example.com',
        githubOwner: 'org',
        githubRepo: 'repo',
        githubToken: 'ghp_longtoken123456',
      });

    const id = createRes.body.data.id;

    const res = await request(getApp())
      .put(`/api/admin/domains/${id}`)
      .set('x-api-key', 'test-admin-key')
      .send({ githubRepo: 'new-repo' });
    expect(res.status).toBe(200);
    expect(res.body.data.githubRepo).toBe('new-repo');
  });

  it('deletes a mapping', async () => {
    const createRes = await request(getApp())
      .post('/api/admin/domains')
      .set('x-api-key', 'test-admin-key')
      .send({
        origin: 'https://stage.example.com',
        githubOwner: 'org',
        githubRepo: 'repo',
        githubToken: 'ghp_longtoken123456',
      });

    const id = createRes.body.data.id;

    const res = await request(getApp())
      .delete(`/api/admin/domains/${id}`)
      .set('x-api-key', 'test-admin-key');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
