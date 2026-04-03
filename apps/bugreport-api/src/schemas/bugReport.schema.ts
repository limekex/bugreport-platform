import { z } from 'zod';

export const bugReportSchema = z.object({
  // Core description
  summary: z.string().min(5).max(200),
  severity: z.enum(['blocker', 'high', 'medium', 'low']),
  whatHappened: z.string().min(10).max(5000),
  expectedResult: z.string().min(5).max(2000),
  actualResult: z.string().min(5).max(2000),
  stepsToReproduce: z.string().min(5).max(5000),
  notes: z.string().max(2000).optional(),

  // Reporter info
  contactEmail: z.string().email().optional(),
  testerId: z.string().max(100).optional(),
  testerRole: z.string().max(100).optional(),

  // App / build context
  environment: z.string().min(1).max(100),
  appVersion: z.string().max(100).optional(),
  commitSha: z.string().max(160).optional(),
  buildNumber: z.string().max(100).optional(),

  // Browser context
  pageUrl: z.string().url().optional(),
  route: z.string().max(500).optional(),
  browser: z.string().max(200).optional(),
  operatingSystem: z.string().max(200).optional(),
  viewport: z.string().max(50).optional(),
  locale: z.string().max(20).optional(),

  // Observability
  traceId: z.string().max(200).optional(),

  // Client-side errors as a JSON string
  optionalClientErrors: z.string().max(10000).optional(),

  // Failed network requests as a JSON string
  failedNetworkRequests: z.string().max(10000).optional(),
});

export type BugReportInput = z.infer<typeof bugReportSchema>;
