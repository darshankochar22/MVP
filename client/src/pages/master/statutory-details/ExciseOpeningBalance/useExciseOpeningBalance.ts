import { useState, useEffect, useCallback } from "react";
import {
  type ExciseOpeningBalance,
  DEFAULT_EXCISE_OPENING_BALANCE,
} from "@/types/entities/ExciseOpeningBalance";

interface Props {
  companyId?: number;
}

export function useExciseOpeningBalance({ companyId }: Props) {
  const [form, setForm] = useState<ExciseOpeningBalance>(DEFAULT_EXCISE_OPENING_BALANCE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setField = <K extends keyof ExciseOpeningBalance>(
    key: K,
    value: ExciseOpeningBalance[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.api.exciseOpeningBalance.get(companyId);
      if (result.success && result.data) {
        setForm({ ...DEFAULT_EXCISE_OPENING_BALANCE, ...result.data });
      } else {
        setForm(DEFAULT_EXCISE_OPENING_BALANCE);
      }
    } catch (err) {
      console.error("Failed to load excise opening balance:", err);
      setError("Failed to load saved excise opening balance.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!companyId) {
      setError("No company selected.");
      return false;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await window.api.exciseOpeningBalance.save({
        ...form,
        company_id: companyId,
      });
      if (!result.success) throw new Error(result.error || "Database save failed");
      setSuccess("Excise Opening Balance saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      console.error("Failed to save excise opening balance:", err);
      setError(err instanceof Error ? err.message : "Failed to save excise opening balance.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, companyId]);

  return { form, setForm, setField, loading, error, setError, success, setSuccess, load, save };
}
