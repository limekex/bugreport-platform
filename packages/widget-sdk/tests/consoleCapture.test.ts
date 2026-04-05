import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  installConsoleErrorHook,
  getCollectedErrors,
  clearCollectedErrors,
  __resetHookForTesting,
} from '../src/utils/consoleCapture';

describe('installConsoleErrorHook', () => {
  beforeEach(() => {
    __resetHookForTesting();
  });

  afterEach(() => {
    __resetHookForTesting();
  });

  it('captures a string console.error call', () => {
    installConsoleErrorHook();
    console.error('Test error message');
    const raw = getCollectedErrors();
    expect(raw).toBeDefined();
    const entries = JSON.parse(raw!);
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toContain('Test error message');
    expect(entries[0].timestamp).toBeDefined();
  });

  it('captures an Error object console.error call', () => {
    installConsoleErrorHook();
    const err = new Error('Something went wrong');
    console.error(err);
    const raw = getCollectedErrors();
    expect(raw).toBeDefined();
    const entries = JSON.parse(raw!);
    expect(entries[0].message).toContain('Something went wrong');
  });

  it('returns undefined when no errors have been captured', () => {
    clearCollectedErrors();
    expect(getCollectedErrors()).toBeUndefined();
  });

  it('keeps a rolling buffer of at most 20 entries', () => {
    installConsoleErrorHook();
    for (let i = 0; i < 25; i++) {
      console.error(`Error number ${i}`);
    }
    const raw = getCollectedErrors();
    const entries = JSON.parse(raw!);
    expect(entries).toHaveLength(20);
    // The oldest 5 should have been dropped — last entry should be #24
    expect(entries[19].message).toContain('Error number 24');
  });

  it('trims message to MAX_MESSAGE_LENGTH (500)', () => {
    installConsoleErrorHook();
    const longMsg = 'x'.repeat(600);
    console.error(longMsg);
    const entries = JSON.parse(getCollectedErrors()!);
    expect(entries[entries.length - 1].message.length).toBeLessThanOrEqual(500);
  });

  it('clears the buffer when clearCollectedErrors is called', () => {
    installConsoleErrorHook();
    console.error('some error');
    clearCollectedErrors();
    expect(getCollectedErrors()).toBeUndefined();
  });
});

describe('getCollectedErrors — output format', () => {
  beforeEach(() => __resetHookForTesting());
  afterEach(() => __resetHookForTesting());

  it('returns a JSON array string', () => {
    installConsoleErrorHook();
    console.error('format check');
    const raw = getCollectedErrors();
    expect(() => JSON.parse(raw!)).not.toThrow();
    expect(Array.isArray(JSON.parse(raw!))).toBe(true);
  });

  it('each entry has a message and timestamp', () => {
    installConsoleErrorHook();
    console.error('entry structure');
    const entries = JSON.parse(getCollectedErrors()!);
    expect(typeof entries[0].message).toBe('string');
    expect(typeof entries[0].timestamp).toBe('string');
  });
});
