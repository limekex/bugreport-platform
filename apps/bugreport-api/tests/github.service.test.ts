import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @octokit/rest before importing the service so the module-level
// `new Octokit(...)` call uses the mock.
const mockCreate = vi.fn().mockResolvedValue({
  data: {
    number: 42,
    html_url: 'https://github.com/test-org/test-repo/issues/42',
  },
});

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: {
      issues: {
        create: mockCreate,
      },
    },
  })),
}));

describe('createGitHubIssue', () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns the created issue number and URL', async () => {
    const { createGitHubIssue } = await import('../src/services/github.service');

    const result = await createGitHubIssue({
      title: '[Stage Bug]: Test issue',
      body: '## Summary\n\nTest body',
      labels: ['bug', 'stage', 'needs-triage', 'severity:high'],
    });

    expect(result.issueNumber).toBe(42);
    expect(result.issueUrl).toBe('https://github.com/test-org/test-repo/issues/42');
  });

  it('calls octokit.rest.issues.create with the correct payload', async () => {
    const { createGitHubIssue } = await import('../src/services/github.service');

    const payload = {
      title: '[Stage Bug]: Another test',
      body: 'body text',
      labels: ['bug', 'stage', 'needs-triage', 'severity:medium'] as const,
    };

    await createGitHubIssue(payload);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '[Stage Bug]: Another test',
        body: 'body text',
        labels: expect.arrayContaining(['bug', 'severity:medium']),
      }),
    );
  });
});
