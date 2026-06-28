import { useState, useEffect, useCallback } from "react";
import {
  type CenvatOpeningBalance,
  DEFAULT_CENVAT_OPENING_BALANCE,
} from "@/types/entities/CenvatOpeningBalance";

interface Props {
  companyId?: number;
}

export function useCenvatOpeningBalance({ companyId }: Props) {
  const [form, setForm] = useState<CenvatOpeningBalance>(DEFAULT_CENVAT_OPENING_BALANCE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setField = <K extends keyof CenvatOpeningBalance>(
    key: K,
    value: CenvatOpeningBalance[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.api.cenvatOpeningBalance.get(companyId);
      if (result.success && result.data) {
        setForm({ ...DEFAULT_CENVAT_OPENING_BALANCE, ...result.data });
      } else {
        setForm(DEFAULT_CENVAT_OPENING_BALANCE);
      }
    } catch (err) {
      console.error("Failed to load CENVAT opening balance:", err);
      setError("Failed to load saved CENVAT opening balance.");
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
      const result = await window.api.cenvatOpeningBalance.save({
        ...form,
        company_id: companyId,
      });
      if (!result.success) throw new Error(result.error || "Database save failed");
      setSuccess("CENVAT Opening Balance saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      console.error("Failed to save CENVAT opening balance:", err);
      setError(err instanceof Error ? err.message : "Failed to save CENVAT opening balance.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, companyId]);

  return { form, setForm, setField, loading, error, setError, success, setSuccess, load, save };
}
