/**
 * Tester Store
 * 
 * Manages tester accounts for authentication and allow-listing.
 * Testers can be required to log in before submitting bug reports.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const SALT_ROUNDS = 10;

export interface Tester {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  emailVerified?: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: string;
}

export interface TesterCreateInput {
  email: string;
  name: string;
  password: string;
}

export interface TesterPublic {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

const TESTERS_FILE = join(process.cwd(), 'data', 'testers.json');

let testers: Tester[] = [];

// ── Load / Save ───────────────────────────────────────────────────────────────

function loadTesters(): void {
  try {
    const data = readFileSync(TESTERS_FILE, 'utf-8');
    testers = JSON.parse(data);
  } catch {
    testers = [];
  }
}

function saveTesters(): void {
  writeFileSync(TESTERS_FILE, JSON.stringify(testers, null, 2), 'utf-8');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function toPublic(tester: Tester): TesterPublic {
  const { passwordHash, ...publicData } = tester;
  return publicData;
}

// ── CRUD Operations ───────────────────────────────────────────────────────────

export function getAllTesters(): TesterPublic[] {
  return testers.map(toPublic);
}

export function getTesterById(id: string): Tester | undefined {
  return testers.find((t) => t.id === id);
}

export function getTesterByEmail(email: string): Tester | undefined {
  return testers.find((t) => t.email.toLowerCase() === email.toLowerCase());
}

export async function createTester(input: TesterCreateInput): Promise<TesterPublic> {
  // Check if email already exists
  if (getTesterByEmail(input.email)) {
    throw new Error('Email already exists');
  }

  const tester: Tester = {
    id: crypto.randomUUID(),
    email: input.email.toLowerCase(),
    name: input.name,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
    isActive: true,    emailVerified: false,
    verificationToken: randomUUID(),  };

  testers.push(tester);
  saveTesters();

  return toPublic(tester);
}

export function updateTesterLastLogin(id: string): void {
  const tester = getTesterById(id);
  if (tester) {
    tester.lastLoginAt = new Date().toISOString();
    saveTesters();
  }
}

export function updateTesterStatus(id: string, isActive: boolean): TesterPublic | undefined {
  const tester = getTesterById(id);
  if (tester) {
    tester.isActive = isActive;
    saveTesters();
    return toPublic(tester);
  }
  return undefined;
}

export function deleteTester(id: string): boolean {
  const index = testers.findIndex((t) => t.id === id);
  if (index !== -1) {
    testers.splice(index, 1);
    saveTesters();
    return true;
  }
  return false;
}

export async function authenticateTester(email: string, password: string): Promise<Tester | null> {
  const tester = getTesterByEmail(email);
  
  if (!tester) {
    return null;
  }

  if (!tester.isActive) {
    return null;
  }

  const isValid = await verifyPassword(password, tester.passwordHash);
  if (!isValid) {
    return null;
  }

  return tester;
}

export function verifyEmail(token: string): boolean {
  const tester = testers.find(t => t.verificationToken === token);
  
  if (!tester || !tester.verificationToken) {
    return false;
  }

  tester.emailVerified = true;
  tester.verificationToken = undefined;
  saveTesters();
  return true;
}

export function getTesterByVerificationToken(token: string): Tester | null {
  return testers.find(t => t.verificationToken === token) || null;
}

export function createResetToken(email: string): string | null {
  const tester = getTesterByEmail(email);
  
  if (!tester) {
    return null;
  }

  const resetToken = randomUUID();
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + 1); // 1 hour expiry

  tester.resetToken = resetToken;
  tester.resetTokenExpiry = expiryDate.toISOString();
  
  saveTesters();
  return resetToken;
}

export function getTesterByResetToken(token: string): Tester | null {
  const tester = testers.find(t => t.resetToken === token);
  
  if (!tester || !tester.resetTokenExpiry) {
    return null;
  }

  // Check if token has expired
  if (new Date(tester.resetTokenExpiry) < new Date()) {
    return null;
  }

  return tester;
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const tester = getTesterByResetToken(token);
  
  if (!tester) {
    return false;
  }

  tester.passwordHash = await hashPassword(newPassword);
  tester.resetToken = undefined;
  tester.resetTokenExpiry = undefined;
  
  saveTesters();
  return true;
}

// Initialize on module load
loadTesters();
