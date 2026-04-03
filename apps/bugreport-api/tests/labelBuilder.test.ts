import { describe, it, expect } from 'vitest';
import { buildLabels } from '../src/services/labelBuilder.service';

const DEFAULT_LABELS = ['bug', 'stage', 'needs-triage'] as const;

describe('buildLabels', () => {
  it('includes all three default base labels', () => {
    const labels = buildLabels('medium', DEFAULT_LABELS);
    expect(labels).toContain('bug');
    expect(labels).toContain('stage');
    expect(labels).toContain('needs-triage');
  });

  it.each([
    ['blocker', 'severity:blocker'],
    ['high', 'severity:high'],
    ['medium', 'severity:medium'],
    ['low', 'severity:low'],
  ] as const)('adds severity label "severity:%s"', (severity, expected) => {
    const labels = buildLabels(severity, DEFAULT_LABELS);
    expect(labels).toContain(expected);
  });

  it('produces exactly 4 labels for a standard report', () => {
    const labels = buildLabels('high', DEFAULT_LABELS);
    expect(labels).toHaveLength(4);
  });

  it('includes only one severity label', () => {
    const labels = buildLabels('low', DEFAULT_LABELS);
    const severityLabels = labels.filter((l) => l.startsWith('severity:'));
    expect(severityLabels).toHaveLength(1);
  });

  it('filters out unknown labels from defaultLabels', () => {
    const withUnknown = ['bug', 'stage', 'needs-triage', 'custom-label'];
    const labels = buildLabels('high', withUnknown);
    expect(labels).not.toContain('custom-label');
  });

  it('works with an empty defaultLabels list', () => {
    const labels = buildLabels('blocker', []);
    expect(labels).toEqual(['severity:blocker']);
  });
});
