import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import { bugReportSchema } from '../schemas/bugReport.schema';
import { formatIssueBody, formatIssueTitle } from '../services/issueFormatter.service';
import { buildLabels } from '../services/labelBuilder.service';
import { createGitHubIssue, GitHubTarget } from '../services/github.service';
import { uploadScreenshot } from '../services/storage.service';
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

    // 2. Bot protection: honeypot + math challenge + timing check
    if (report.botCheck) {
      try {
        const botCheck = JSON.parse(report.botCheck);
        
        // Check 1: Honeypot field should be empty (bots often auto-fill all fields)
        if (botCheck.honeypot && botCheck.honeypot.trim() !== '') {
          logger.warn({ reportId }, 'Bot detected: honeypot field filled');
          res.status(400).json({
            success: false,
            error: 'Invalid submission detected.',
          });
          return;
        }

        // Check 2: Math answer should be present (basic validation)
        // The frontend stores the correct answer in a data attribute, 
        // but we don't validate the actual math here since that would require
        // recreating the same random question. Instead, we just check it exists.
        // A more sophisticated approach would send a hashed challenge token.
        if (!botCheck.mathAnswer || botCheck.mathAnswer.toString().trim() === '') {
          logger.warn({ reportId }, 'Bot detected: math answer missing');
          res.status(400).json({
            success: false,
            error: 'Please answer the verification question.',
          });
          return;
        }

        // Check 3: Timing check - submissions under 2 seconds are suspicious
        const MIN_TIME_SECONDS = 2;
        if (botCheck.timeSpent < MIN_TIME_SECONDS) {
          logger.warn({ reportId, timeSpent: botCheck.timeSpent }, 'Bot detected: submission too fast');
          res.status(400).json({
            success: false,
            error: 'Submission too fast. Please take your time to fill out the form.',
          });
          return;
        }
      } catch (err) {
        logger.warn({ reportId, error: err }, 'Failed to parse botCheck');
        res.status(400).json({
          success: false,
          error: 'Invalid bot verification data.',
        });
        return;
      }
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
