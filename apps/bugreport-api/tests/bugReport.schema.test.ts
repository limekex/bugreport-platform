import { describe, it, expect } from 'vitest';
import { bugReportSchema } from '../src/schemas/bugReport.schema';

const validBase = {
  summary: 'Login button does nothing on the login page',
  severity: 'high',
  whatHappened: 'Clicking the login button does absolutely nothing.',
  expectedResult: 'User is redirected to dashboard.',
  actualResult: 'Nothing happens, no error shown.',
  stepsToReproduce: '1. Open /login\n2. Enter valid credentials\n3. Click Login',
  environment: 'staging',
};

describe('bugReportSchema — valid payloads', () => {
  it('accepts a minimal valid payload', () => {
    const result = bugReportSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('accepts a full payload with all optional fields', () => {
    const full = {
      ...validBase,
      notes: 'Happens consistently in Chrome.',
      contactEmail: 'tester@example.com',
      testerId: 'tester-001',
      testerRole: 'qa',
      appVersion: '1.2.3',
      commitSha: 'abc1234',
      buildNumber: '98',
      pageUrl: 'https://stage.example.com/login',
      route: '/login',
      browser: 'Mozilla/5.0',
      operatingSystem: 'macOS 14.4',
      viewport: '1440x900',
      locale: 'en-GB',
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      optionalClientErrors: '[]',
    };
    const result = bugReportSchema.safeParse(full);
    expect(result.success).toBe(true);
  });
});

describe('bugReportSchema — required field validation', () => {
  it('rejects when summary is missing', () => {
    const { summary: _, ...without } = validBase;
    expect(bugReportSchema.safeParse(without).success).toBe(false);
  });

  it('rejects when severity is missing', () => {
    const { severity: _, ...without } = validBase;
    expect(bugReportSchema.safeParse(without).success).toBe(false);
  });

  it('rejects when whatHappened is missing', () => {
    const { whatHappened: _, ...without } = validBase;
    expect(bugReportSchema.safeParse(without).success).toBe(false);
  });

  it('rejects when expectedResult is missing', () => {
    const { expectedResult: _, ...without } = validBase;
    expect(bugReportSchema.safeParse(without).success).toBe(false);
  });

  it('rejects when actualResult is missing', () => {
    const { actualResult: _, ...without } = validBase;
    expect(bugReportSchema.safeParse(without).success).toBe(false);
  });

  it('rejects when stepsToReproduce is missing', () => {
    const { stepsToReproduce: _, ...without } = validBase;
    expect(bugReportSchema.safeParse(without).success).toBe(false);
  });

  it('rejects when environment is missing', () => {
    const { environment: _, ...without } = validBase;
    expect(bugReportSchema.safeParse(without).success).toBe(false);
  });
});

describe('bugReportSchema — length constraints', () => {
  it('rejects summary shorter than 5 characters', () => {
    const result = bugReportSchema.safeParse({ ...validBase, summary: 'bug' });
    expect(result.success).toBe(false);
  });

  it('rejects summary longer than 200 characters', () => {
    const result = bugReportSchema.safeParse({ ...validBase, summary: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects whatHappened shorter than 10 characters', () => {
    const result = bugReportSchema.safeParse({ ...validBase, whatHappened: 'Short' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid contactEmail', () => {
    const result = bugReportSchema.safeParse({ ...validBase, contactEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid pageUrl', () => {
    const result = bugReportSchema.safeParse({ ...validBase, pageUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});

describe('bugReportSchema — severity enum', () => {
  it.each(['blocker', 'high', 'medium', 'low'])('accepts severity "%s"', (severity) => {
    const result = bugReportSchema.safeParse({ ...validBase, severity });
    expect(result.success).toBe(true);
  });

  it('rejects unknown severity value', () => {
    const result = bugReportSchema.safeParse({ ...validBase, severity: 'critical' });
    expect(result.success).toBe(false);
  });
});
