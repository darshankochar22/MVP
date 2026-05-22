import { useEffect, useRef, useCallback } from "react";
import { saveFormState, clearFormState } from "../utils/formPersistence";

export function useAutoSave(key: string | null, data: unknown) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!key) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveFormState(key, data);
  }, [key, data]);

  const clear = useCallback(() => {
    if (key) clearFormState(key);
    isFirstRender.current = true;
  }, [key]);

  return { clear };
}
