import { useState, useEffect, useCallback } from "react";
import {
  type PlaOpeningBalance,
  DEFAULT_PLA_OPENING_BALANCE,
} from "@/types/entities/PlaOpeningBalance";

interface Props {
  companyId?: number;
}

export function usePlaOpeningBalance({ companyId }: Props) {
  const [form, setForm] = useState<PlaOpeningBalance>(DEFAULT_PLA_OPENING_BALANCE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Header dropdown option lists (live from existing masters).
  const [gstRegistrationOptions, setGstRegistrationOptions] = useState<string[]>([]);
  const [taxUnitOptions, setTaxUnitOptions] = useState<string[]>([]);

  const setField = <K extends keyof PlaOpeningBalance>(
    key: K,
    value: PlaOpeningBalance[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.api.plaOpeningBalance.get(companyId);
      if (result.success && result.data) {
        setForm({ ...DEFAULT_PLA_OPENING_BALANCE, ...result.data });
      } else {
        setForm(DEFAULT_PLA_OPENING_BALANCE);
      }
    } catch (err) {
      console.error("Failed to load PLA opening balance:", err);
      setError("Failed to load saved PLA opening balance.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadOptions = useCallback(async () => {
    if (!companyId) return;
    try {
      const gstRes = await window.api.gstRegistration.getAll(companyId);
      if (gstRes?.success && Array.isArray(gstRes.gstRegistrations)) {
        const names = gstRes.gstRegistrations
          .map((g: Record<string, unknown>) => {
            const state = (g.state_id as string) || "";
            const legal = (g.legal_name as string) || (g.trade_name as string) || "";
            return state ? `${state} Registration` : legal;
          })
          .filter((n: string) => n.trim() !== "");
        setGstRegistrationOptions(Array.from(new Set(names)));
      }
    } catch (err) {
      console.error("Failed to load GST registrations:", err);
    }
    try {
      const tuRes = await window.api.taxUnits.getAll(companyId);
      if (tuRes?.success && Array.isArray(tuRes.taxUnits)) {
        const names = tuRes.taxUnits
          .map((t: Record<string, unknown>) => (t.name as string) || "")
          .filter((n: string) => n.trim() !== "");
        setTaxUnitOptions(names);
      }
    } catch (err) {
      console.error("Failed to load tax units:", err);
    }
  }, [companyId]);

  useEffect(() => {
    load();
    loadOptions();
  }, [load, loadOptions]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!companyId) {
      setError("No company selected.");
      return false;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await window.api.plaOpeningBalance.save({
        ...form,
        company_id: companyId,
      });
      if (!result.success) throw new Error(result.error || "Database save failed");
      setSuccess("PLA Opening Balance saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      console.error("Failed to save PLA opening balance:", err);
      setError(err instanceof Error ? err.message : "Failed to save PLA opening balance.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, companyId]);

  return {
    form,
    setForm,
    setField,
    loading,
    error,
    setError,
    success,
    setSuccess,
    load,
    save,
    gstRegistrationOptions,
    taxUnitOptions,
  };
}
