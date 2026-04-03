import { Octokit } from '@octokit/rest';
import { config } from '../config';
import { GitHubIssuePayload, GitHubIssueResult } from '@bugreport/shared-types';
import { logger } from '../lib/logger';

const octokit = new Octokit({ auth: config.github.token });

/**
 * Creates a GitHub issue in the configured repository.
 *
 * TODO: Replace placeholder error handling with retry logic and
 *       structured error types once the service is proven in staging.
 */
export async function createGitHubIssue(payload: GitHubIssuePayload): Promise<GitHubIssueResult> {
  logger.info(
    { title: payload.title, labels: payload.labels },
    'Creating GitHub issue',
  );

  const response = await octokit.rest.issues.create({
    owner: config.github.owner,
    repo: config.github.repo,
    title: payload.title,
    body: payload.body,
    labels: payload.labels,
  });

  return {
    issueNumber: response.data.number,
    issueUrl: response.data.html_url,
  };
}
