import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import { bugReportSchema } from '../schemas/bugReport.schema';
import { formatIssueBody, formatIssueTitle } from '../services/issueFormatter.service';
import { buildLabels } from '../services/labelBuilder.service';
import { createGitHubIssue, GitHubTarget } from '../services/github.service';
import { uploadScreenshot } from '../services/storage.service';
import { verifyTurnstileToken } from '../services/turnstile.service';
import { config } from '../config';
import { getMappingByOrigin } from '../store/domainMappingStore';
import { logger } from '../lib/logger';

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
    const timestamp = new Date().toISOString();

    // 2. Verify Turnstile token if required
    if (config.turnstile?.required && report.turnstileToken) {
      const clientIp = req.ip || req.socket.remoteAddress;
      const isValid = await verifyTurnstileToken(report.turnstileToken, clientIp);
      
      if (!isValid) {
        res.status(400).json({
          success: false,
          error: 'Bot verification failed. Please try again.',
        });
        return;
      }
    } else if (config.turnstile?.required && !report.turnstileToken) {
      res.status(400).json({
        success: false,
        error: 'Bot verification required.',
      });
      return;
    }

    // 3. Resolve GitHub target from the request origin (domain mapping)
    const origin = req.headers.origin;
    const mapping = origin ? getMappingByOrigin(origin) : undefined;

    let target: GitHubTarget | undefined;
    let defaultLabels = config.github.defaultLabels;

    if (mapping) {
      target = {
        owner: mapping.githubOwner,
        repo: mapping.githubRepo,
        token: mapping.githubToken,
      };
      defaultLabels = mapping.defaultLabels;
    }

    // 4. Handle optional screenshot upload
    let screenshotUrl: string | undefined;
    const file = req.file;
    if (file) {
      const result = await uploadScreenshot(file.path, file.mimetype, file.originalname);
      screenshotUrl = result.url ?? undefined;
    }

    // 5. Format issue body and title
    const title = formatIssueTitle(report.summary);
    const body = formatIssueBody(report, screenshotUrl, timestamp);

    // 6. Build label list
    const labels = buildLabels(report.severity, defaultLabels);

    // 7. Create GitHub issue
    const { issueNumber, issueUrl } = await createGitHubIssue({ title, body, labels }, target);

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
