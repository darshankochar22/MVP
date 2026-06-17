/**
 * Tests for client/src/utils/formPersistence.ts
 *
 * Form persistence is currently disabled — saveFormState / loadFormState /
 * clearFormState are no-ops.  Forms always start from their INITIAL defaults.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveFormState,
  loadFormState,
  clearFormState,
} from '../utils/formPersistence';

beforeEach(() => {
  sessionStorage.clear();
});

describe('saveFormState (no-op)', () => {
  it('does NOT write to sessionStorage', () => {
    saveFormState('myForm', { name: 'Alice', age: 30 });
    expect(sessionStorage.getItem('formData_myForm')).toBeNull();
  });

  it('does NOT write string values', () => {
    saveFormState('test', 'hello');
    expect(sessionStorage.getItem('formData_test')).toBeNull();
  });

  it('does NOT write number values', () => {
    saveFormState('num', 42);
    expect(sessionStorage.getItem('formData_num')).toBeNull();
  });

  it('does NOT write array values', () => {
    saveFormState('arr', [1, 2, 3]);
    expect(sessionStorage.getItem('formData_arr')).toBeNull();
  });
});

describe('loadFormState (always null)', () => {
  it('returns null when nothing was saved', () => {
    expect(loadFormState('nonexistent')).toBeNull();
  });

  it('returns null even when something exists in sessionStorage', () => {
    sessionStorage.setItem('formData_form1', JSON.stringify({ foo: 'bar' }));
    expect(loadFormState('form1')).toBeNull();
  });

  it('returns null even with malformed JSON', () => {
    sessionStorage.setItem('formData_bad', 'not-json{{{{');
    expect(loadFormState('bad')).toBeNull();
  });
});

describe('clearFormState (no-op)', () => {
  it('does NOT remove the key from sessionStorage', () => {
    sessionStorage.setItem('formData_toClear', 'data');
    clearFormState('toClear');
    expect(sessionStorage.getItem('formData_toClear')).toBe('data');
  });

  it('does not throw when nothing was stored', () => {
    expect(() => clearFormState('neverSet')).not.toThrow();
  });
});
