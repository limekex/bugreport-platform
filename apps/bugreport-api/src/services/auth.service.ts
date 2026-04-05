/**
 * Auth Service
 * 
 * Handles JWT token generation and validation for tester authentication.
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface TesterTokenPayload {
  testerId: string;
  email: string;
  name: string;
}

const JWT_SECRET = config.auth.jwtSecret;
const TOKEN_EXPIRY = '30d'; // 30 days

export function generateTesterToken(payload: TesterTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export function verifyTesterToken(token: string): TesterTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TesterTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}
