import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import type {
  DomainMapping,
  CreateDomainMappingRequest,
  UpdateDomainMappingRequest,
} from '@bugreport/shared-types';
import { logger } from '../lib/logger';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'domain-mappings.json');

/** In-memory cache of domain mappings, loaded from disk at startup. */
let mappings: DomainMapping[] = [];

/**
 * Ensures the data directory and JSON file exist, then loads mappings into memory.
 * Called once during application bootstrap.
 */
export function initDomainMappingStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    mappings = JSON.parse(raw) as DomainMapping[];
    logger.info({ count: mappings.length }, 'Domain mappings loaded');
  } catch (err) {
    logger.error({ err }, 'Failed to load domain mappings – starting with empty set');
    mappings = [];
  }
}

function persist(): void {
  // Fire-and-forget async write to avoid blocking the event loop.
  // The in-memory array is the source of truth; the file is a durable backup.
  fsp
    .writeFile(DATA_FILE, JSON.stringify(mappings, null, 2), 'utf-8')
    .catch((err) => logger.error({ err }, 'Failed to persist domain mappings'));
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function getAllMappings(): DomainMapping[] {
  return mappings;
}

export function getMappingById(id: string): DomainMapping | undefined {
  return mappings.find((m) => m.id === id);
}

/**
 * Look up a mapping by the request's `Origin` header value.
 * Returns `undefined` when no mapping is configured for the given origin.
 */
export function getMappingByOrigin(origin: string): DomainMapping | undefined {
  return mappings.find((m) => m.origin === origin);
}

/**
 * Returns all configured origins so they can be allowed dynamically by CORS.
 */
export function getAllowedOrigins(): string[] {
  return mappings.map((m) => m.origin);
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function createMapping(data: CreateDomainMappingRequest): DomainMapping {
  const now = new Date().toISOString();
  const mapping: DomainMapping = {
    id: nanoid(),
    origin: data.origin,
    githubOwner: data.githubOwner,
    githubRepo: data.githubRepo,
    githubToken: data.githubToken,
    defaultLabels: data.defaultLabels,
    createdAt: now,
    updatedAt: now,
  };
  mappings.push(mapping);
  persist();
  logger.info({ id: mapping.id, origin: mapping.origin }, 'Domain mapping created');
  return mapping;
}

export function updateMapping(id: string, data: UpdateDomainMappingRequest): DomainMapping | undefined {
  const idx = mappings.findIndex((m) => m.id === id);
  if (idx === -1) return undefined;

  const existing = mappings[idx];
  const updated: DomainMapping = {
    ...existing,
    ...data,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  mappings[idx] = updated;
  persist();
  logger.info({ id, origin: updated.origin }, 'Domain mapping updated');
  return updated;
}

export function deleteMapping(id: string): boolean {
  const idx = mappings.findIndex((m) => m.id === id);
  if (idx === -1) return false;
  mappings.splice(idx, 1);
  persist();
  logger.info({ id }, 'Domain mapping deleted');
  return true;
}

// ── Test helpers ─────────────────────────────────────────────────────────────

/** Reset the in-memory store (used in tests). */
export function _resetStore(initial: DomainMapping[] = []): void {
  mappings = initial;
}
