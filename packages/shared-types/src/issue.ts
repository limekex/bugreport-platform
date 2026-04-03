/**
 * Types related to GitHub Issue creation / formatting.
 */

export type IssueSeverityLabel =
  | 'severity:blocker'
  | 'severity:high'
  | 'severity:medium'
  | 'severity:low';

export type IssueBaseLabel = 'bug' | 'stage' | 'needs-triage';

export type IssueLabel = IssueBaseLabel | IssueSeverityLabel;

export interface GitHubIssuePayload {
  title: string;
  body: string;
  labels: IssueLabel[];
}

export interface GitHubIssueResult {
  issueNumber: number;
  issueUrl: string;
}
