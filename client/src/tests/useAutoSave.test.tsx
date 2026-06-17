/**
 * Tests for client/src/hooks/useAutoSave.ts
 *
 * Form persistence is disabled — useAutoSave's underlying saveFormState /
 * loadFormState / clearFormState are no-ops.  The hook still tracks its
 * internal first-render guard correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../hooks/useAutoSave';
import { loadFormState } from '../utils/formPersistence';

beforeEach(() => {
  sessionStorage.clear();
});

describe('useAutoSave (persistence disabled)', () => {
  it('does NOT write to sessionStorage on the very first render', () => {
    renderHook(() => useAutoSave('firstRender', { name: 'Alice' }));
    expect(sessionStorage.getItem('formData_firstRender')).toBeNull();
  });

  it('does NOT write to sessionStorage even after data changes', () => {
    const { rerender } = renderHook(
      ({ data }: { data: unknown }) => useAutoSave('myKey', data),
      { initialProps: { data: { name: 'Alice' } } }
    );

    expect(loadFormState('myKey')).toBeNull();

    act(() => {
      rerender({ data: { name: 'Bob' } });
    });

    expect(loadFormState('myKey')).toBeNull();
  });

  it('does NOT write on multiple data changes', () => {
    const { rerender } = renderHook(
      ({ data }: { data: unknown }) => useAutoSave('counter', data),
      { initialProps: { data: { count: 0 } } }
    );

    act(() => { rerender({ data: { count: 1 } }); });
    expect(loadFormState('counter')).toBeNull();

    act(() => { rerender({ data: { count: 2 } }); });
    expect(loadFormState('counter')).toBeNull();
  });

  it('does nothing when key is null', () => {
    const { rerender } = renderHook(
      ({ data }: { data: unknown }) => useAutoSave(null, data),
      { initialProps: { data: { name: 'Alice' } } }
    );
    act(() => { rerender({ data: { name: 'Bob' } }); });
    expect(sessionStorage.length).toBe(0);
  });

  it('clear() is a no-op on sessionStorage', () => {
    const { result, rerender } = renderHook(
      ({ data }: { data: unknown }) => useAutoSave('toClear', data),
      { initialProps: { data: { step: 1 } } }
    );

    act(() => { rerender({ data: { step: 2 } }); });
    expect(loadFormState('toClear')).toBeNull();

    act(() => { result.current.clear(); });
    expect(loadFormState('toClear')).toBeNull();
  });

  it('clear() resets the first-render guard', () => {
    const { result, rerender } = renderHook(
      ({ data }: { data: unknown }) => useAutoSave('guardReset', data),
      { initialProps: { data: { v: 1 } } }
    );

    act(() => { rerender({ data: { v: 2 } }); });
    expect(loadFormState('guardReset')).toBeNull();

    act(() => { result.current.clear(); });
    expect(loadFormState('guardReset')).toBeNull();

    act(() => { rerender({ data: { v: 3 } }); });
    expect(loadFormState('guardReset')).toBeNull();
  });
});
