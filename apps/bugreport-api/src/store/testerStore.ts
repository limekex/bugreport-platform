/**
 * Tester Store
 * 
 * Manages tester accounts for authentication and allow-listing.
 * Testers can be required to log in before submitting bug reports.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

export interface Tester {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
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

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
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

export function createTester(input: TesterCreateInput): TesterPublic {
  // Check if email already exists
  if (getTesterByEmail(input.email)) {
    throw new Error('Email already exists');
  }

  const tester: Tester = {
    id: crypto.randomUUID(),
    email: input.email.toLowerCase(),
    name: input.name,
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
    isActive: true,
  };

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

export function authenticateTester(email: string, password: string): Tester | null {
  const tester = getTesterByEmail(email);
  
  if (!tester) {
    return null;
  }

  if (!tester.isActive) {
    return null;
  }

  if (!verifyPassword(password, tester.passwordHash)) {
    return null;
  }

  return tester;
}

// Initialize on module load
loadTesters();
