import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import { bugReportSchema } from '../schemas/bugReport.schema';
import { formatIssueBody, formatIssueTitle } from '../services/issueFormatter.service';
import { createGitHubIssue } from '../services/github.service';
import { uploadScreenshot } from '../services/storage.service';
import { config } from '../config';
import { logger } from '../lib/logger';
import type { BugSeverity, IssueSeverityLabel, IssueLabel } from '@bugreport/shared-types';

function severityLabel(severity: BugSeverity): IssueSeverityLabel {
  return `severity:${severity}`;
}

export async function submitBugReport(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Validate body fields (multipart text fields arrive as req.body)
    const parsed = bugReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.flatten(),
      });
      return;
    }

    const report = parsed.data;
    const reportId = nanoid();

    // 2. Handle optional screenshot upload
    let screenshotUrl: string | undefined;
    const file = req.file;
    if (file) {
      const result = await uploadScreenshot(file.path, file.mimetype);
      screenshotUrl = result.url ?? undefined;
    }

    // 3. Format issue body and title
    const title = formatIssueTitle(report.summary);
    const body = formatIssueBody(report, screenshotUrl);

    // 4. Build label list
    const defaultLabels = config.github.defaultLabels as IssueLabel[];
    const labels: IssueLabel[] = [...defaultLabels, severityLabel(report.severity)];

    // 5. Create GitHub issue
    const { issueNumber, issueUrl } = await createGitHubIssue({ title, body, labels });

    logger.info({ reportId, issueNumber, issueUrl }, 'Bug report submitted successfully');

    res.status(201).json({
      success: true,
      reportId,
      githubIssueNumber: issueNumber,
      githubIssueUrl: issueUrl,
      message: 'Bug report submitted. A GitHub issue has been created.',
    });
  } catch (err) {
    next(err);
  }
}
