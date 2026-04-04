/**
 * Types for domain-to-GitHub-repository mapping.
 *
 * Each mapping links a frontend origin (domain) to a specific GitHub
 * repository so the platform can serve multiple projects simultaneously.
 */

export interface DomainMapping {
  /** Unique identifier (nanoid) */
  id: string;
  /** Origin URL, e.g. "https://stage.myapp.com" */
  origin: string;
  /** GitHub organisation or user that owns the target repo */
  githubOwner: string;
  /** Repository name where issues will be created */
  githubRepo: string;
  /** Personal access token or GitHub App installation token */
  githubToken: string;
  /** Comma-separated default labels added to every created issue */
  defaultLabels: string[];
  /** ISO-8601 timestamp of when this mapping was created */
  createdAt: string;
  /** ISO-8601 timestamp of the last update */
  updatedAt: string;
}

/** Payload for creating a new domain mapping (id & timestamps are generated server-side) */
export type CreateDomainMappingRequest = Omit<DomainMapping, 'id' | 'createdAt' | 'updatedAt'>;

/** Payload for updating an existing domain mapping (all fields optional except id) */
export type UpdateDomainMappingRequest = Partial<Omit<DomainMapping, 'id' | 'createdAt' | 'updatedAt'>>;
