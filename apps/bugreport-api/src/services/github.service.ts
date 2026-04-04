import { Octokit } from '@octokit/rest';
import { config } from '../config';
import { GitHubIssuePayload, GitHubIssueResult } from '@bugreport/shared-types';
import { logger } from '../lib/logger';

/** Per-request GitHub target, resolved from a domain mapping or env-var fallback. */
export interface GitHubTarget {
  owner: string;
  repo: string;
  token: string;
}

/**
 * Creates a GitHub issue in the given (or default) repository.
 *
 * When `target` is provided the issue is filed in that specific repo
 * (multi-project mode). When omitted, the global env-var config is used
 * (backward-compatible single-repo mode).
 *
 * TODO: Replace placeholder error handling with retry logic and
 *       structured error types once the service is proven in staging.
 */
export async function createGitHubIssue(
  payload: GitHubIssuePayload,
  target?: GitHubTarget,
): Promise<GitHubIssueResult> {
  const owner = target?.owner ?? config.github.owner;
  const repo = target?.repo ?? config.github.repo;
  const token = target?.token ?? config.github.token;

  const octokit = new Octokit({ auth: token });

  logger.info(
    { title: payload.title, labels: payload.labels, owner, repo },
    'Creating GitHub issue',
  );

  const response = await octokit.rest.issues.create({
    owner,
    repo,
    title: payload.title,
    body: payload.body,
    labels: payload.labels,
  });

  return {
    issueNumber: response.data.number,
    issueUrl: response.data.html_url,
  };
}
