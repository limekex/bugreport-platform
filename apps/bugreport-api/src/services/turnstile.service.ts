import { logger } from '../lib/logger';
import { config } from '../config';

/**
 * Verifies a Cloudflare Turnstile response token.
 * 
 * @param token - The cf-turnstile-response token from the client
 * @param remoteIp - Optional remote IP address
 * @returns true if verification succeeds, false otherwise
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const secretKey = config.turnstile?.secretKey;
  
  // If Turnstile is not configured, skip verification
  if (!secretKey) {
    logger.warn('Turnstile secret key not configured, skipping verification');
    return true;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const result = await response.json() as {
      success: boolean;
      'error-codes'?: string[];
      challenge_ts?: string;
      hostname?: string;
    };

    if (!result.success) {
      logger.warn({ errorCodes: result['error-codes'] }, 'Turnstile verification failed');
      return false;
    }

    logger.info('Turnstile verification succeeded');
    return true;
  } catch (error) {
    logger.error({ error }, 'Turnstile verification error');
    return false;
  }
}
