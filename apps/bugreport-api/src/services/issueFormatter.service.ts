import { BugReportInput } from '../schemas/bugReport.schema';

/**
 * Formats a validated bug report payload into the GitHub Issue markdown body.
 *
 * The template is kept in sync with docs/ISSUE_FORMAT.md.
 */
export function formatIssueBody(report: BugReportInput, screenshotUrl?: string): string {
  const lines: string[] = [];

  const field = (label: string, value?: string) => {
    if (value) lines.push(`**${label}:** ${value}`);
  };

  const section = (title: string, content?: string) => {
    if (!content) return;
    lines.push(`\n## ${title}\n`);
    lines.push(content);
  };

  // ── Summary ────────────────────────────────────────────────────────────────
  lines.push(`## Summary\n`);
  lines.push(report.summary);

  // ── Environment ────────────────────────────────────────────────────────────
  lines.push(`\n## Environment\n`);
  field('Environment', report.environment);
  field('App version', report.appVersion);
  field('Commit SHA', report.commitSha);
  field('Build number', report.buildNumber);
  field('Page URL', report.pageUrl);
  field('Route', report.route);

  // ── Reporter ───────────────────────────────────────────────────────────────
  lines.push(`\n## Reporter\n`);
  field('Tester ID', report.testerId);
  field('Tester role', report.testerRole);
  field('Contact email', report.contactEmail);

  // ── Severity ───────────────────────────────────────────────────────────────
  lines.push(`\n## Severity\n`);
  lines.push(`**${report.severity.toUpperCase()}**`);

  // ── What happened ──────────────────────────────────────────────────────────
  section('What happened', report.whatHappened);

  // ── Expected result ────────────────────────────────────────────────────────
  section('Expected result', report.expectedResult);

  // ── Actual result ──────────────────────────────────────────────────────────
  section('Actual result', report.actualResult);

  // ── Steps to reproduce ─────────────────────────────────────────────────────
  section('Steps to reproduce', report.stepsToReproduce);

  // ── Technical context ──────────────────────────────────────────────────────
  lines.push(`\n## Technical context\n`);
  field('Browser', report.browser);
  field('Operating system', report.operatingSystem);
  field('Viewport', report.viewport);
  field('Locale', report.locale);
  field('Trace ID', report.traceId);

  // ── Screenshot ─────────────────────────────────────────────────────────────
  if (screenshotUrl) {
    lines.push(`\n## Screenshot\n`);
    lines.push(`![Screenshot](${screenshotUrl})`);
  }

  // ── Optional client errors ─────────────────────────────────────────────────
  if (report.optionalClientErrors) {
    lines.push(`\n## Optional client errors\n`);
    lines.push('```json');
    lines.push(report.optionalClientErrors);
    lines.push('```');
  }

  // ── Notes ──────────────────────────────────────────────────────────────────
  section('Notes', report.notes);

  return lines.join('\n');
}

export function formatIssueTitle(summary: string): string {
  return `[Stage Bug]: ${summary}`;
}
