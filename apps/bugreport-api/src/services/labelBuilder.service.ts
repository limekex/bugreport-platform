import type { BugSeverity, IssueLabel, IssueSeverityLabel, IssueBaseLabel } from '@bugreport/shared-types';

/**
 * Builds the full label list for a new GitHub issue.
 *
 * Always includes the configured default labels (bug, stage, needs-triage).
 * Always adds exactly one severity label.
 */
export function buildLabels(
  severity: BugSeverity,
  defaultLabels: readonly string[],
): IssueLabel[] {
  const severityLabel: IssueSeverityLabel = `severity:${severity}`;
  const base = defaultLabels.filter(isIssueBaseLabel);
  return [...base, severityLabel];
}

function isIssueBaseLabel(label: string): label is IssueBaseLabel {
  return label === 'bug' || label === 'stage' || label === 'needs-triage';
}
