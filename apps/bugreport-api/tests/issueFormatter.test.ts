import { describe, it, expect } from 'vitest';
import { formatIssueBody, formatIssueTitle } from '../src/services/issueFormatter.service';
import type { BugReportInput } from '../src/schemas/bugReport.schema';

const base: BugReportInput = {
  summary: 'Login button does nothing',
  severity: 'high',
  whatHappened: 'Clicking the login button does nothing.',
  expectedResult: 'User should be redirected to the dashboard.',
  actualResult: 'Nothing happens. No error shown.',
  stepsToReproduce: '1. Open /login\n2. Enter valid credentials\n3. Click Login',
  environment: 'staging',
};

describe('formatIssueTitle', () => {
  it('formats title with prefix', () => {
    expect(formatIssueTitle('Login button does nothing')).toBe(
      '[Stage Bug]: Login button does nothing',
    );
  });
});

describe('formatIssueBody', () => {
  it('includes all required sections', () => {
    const body = formatIssueBody(base, undefined, '2024-01-01T00:00:00.000Z');
    expect(body).toContain('## Summary');
    expect(body).toContain('Login button does nothing');
    expect(body).toContain('## Severity');
    expect(body).toContain('HIGH');
    expect(body).toContain('## What happened');
    expect(body).toContain('## Expected result');
    expect(body).toContain('## Actual result');
    expect(body).toContain('## Steps to reproduce');
  });

  it('includes the provided timestamp in the Environment section', () => {
    const ts = '2024-06-15T10:30:00.000Z';
    const body = formatIssueBody(base, undefined, ts);
    expect(body).toContain(`**Timestamp:** ${ts}`);
  });

  it('generates a timestamp automatically when none is provided', () => {
    const body = formatIssueBody(base);
    expect(body).toContain('**Timestamp:**');
  });

  it('shows "unknown" for tester ID and role when not provided', () => {
    const body = formatIssueBody(base, undefined, '2024-01-01T00:00:00.000Z');
    expect(body).toContain('**Tester ID:** unknown');
    expect(body).toContain('**Tester role:** unknown');
  });

  it('shows the provided tester ID and role', () => {
    const body = formatIssueBody(
      { ...base, testerId: 'tester-001', testerRole: 'qa' },
      undefined,
      '2024-01-01T00:00:00.000Z',
    );
    expect(body).toContain('**Tester ID:** tester-001');
    expect(body).toContain('**Tester role:** qa');
  });

  it('includes screenshot when provided', () => {
    const body = formatIssueBody(base, 'https://cdn.example.com/screenshot.png', '2024-01-01T00:00:00.000Z');
    expect(body).toContain('## Screenshot');
    expect(body).toContain('![Screenshot](https://cdn.example.com/screenshot.png)');
  });

  it('shows "No screenshot attached" when no screenshot is provided', () => {
    const body = formatIssueBody(base, undefined, '2024-01-01T00:00:00.000Z');
    expect(body).toContain('## Screenshot');
    expect(body).toContain('No screenshot attached');
  });
});
