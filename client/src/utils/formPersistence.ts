/**
 * Form state persistence helpers.
 *
 * Currently disabled — saveFormState and loadFormState are no-ops.
 * Form toggles always reset to their initial defaults (No/0) on mount.
 *
 * To re-enable, uncomment the sessionStorage lines in each function.
 */

export function saveFormState(_key: string, _data: unknown): void {
  // No-op: form state is not persisted across navigation
}

export function loadFormState<T>(_key: string): T | null {
  // Always returns null — forms always start from INITIAL defaults
  return null;
}

export function clearFormState(_key: string): void {
  // No-op: nothing to clear since nothing is saved
}
