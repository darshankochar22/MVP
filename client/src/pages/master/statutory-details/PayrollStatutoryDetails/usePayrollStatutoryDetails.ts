import { useState, useEffect, useCallback } from "react";
import {
  type PayrollStatutoryDetails,
  DEFAULT_PAYROLL_STATUTORY_DETAILS,
} from "@/types/entities/PayrollStatutoryDetails";

interface Props {
  companyId?: number;
}

export function usePayrollStatutoryDetails({ companyId }: Props) {
  const [form, setForm] = useState<PayrollStatutoryDetails>(DEFAULT_PAYROLL_STATUTORY_DETAILS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setField = <K extends keyof PayrollStatutoryDetails>(
    key: K,
    value: PayrollStatutoryDetails[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.api.payrollStatutoryDetails.get(companyId);
      if (result.success && result.data) {
        setForm({ ...DEFAULT_PAYROLL_STATUTORY_DETAILS, ...result.data });
      } else {
        setForm(DEFAULT_PAYROLL_STATUTORY_DETAILS);
      }
    } catch (err) {
      console.error("Failed to load payroll statutory details:", err);
      setError("Failed to load saved payroll statutory details.");
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
      const result = await window.api.payrollStatutoryDetails.save({
        ...form,
        company_id: companyId,
      });
      if (!result.success) throw new Error(result.error || "Database save failed");
      setSuccess("Payroll Statutory Details saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      console.error("Failed to save payroll statutory details:", err);
      setError(err instanceof Error ? err.message : "Failed to save payroll statutory details.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, companyId]);

  return { form, setForm, setField, loading, error, setError, success, setSuccess, load, save };
}
