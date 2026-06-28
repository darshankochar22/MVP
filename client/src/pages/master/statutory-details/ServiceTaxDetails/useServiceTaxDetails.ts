import { useState, useEffect, useCallback } from "react";
import {
  type ServiceTaxDetails,
  DEFAULT_SERVICE_TAX_DETAILS,
} from "@/types/entities/ServiceTaxDetails";

interface Props {
  companyId?: number;
}

export function useServiceTaxDetails({ companyId }: Props) {
  const [form, setForm] = useState<ServiceTaxDetails>(DEFAULT_SERVICE_TAX_DETAILS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setField = <K extends keyof ServiceTaxDetails>(
    key: K,
    value: ServiceTaxDetails[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.api.serviceTaxDetails.get(companyId);
      if (result.success && result.data) {
        setForm({ ...DEFAULT_SERVICE_TAX_DETAILS, ...result.data });
      } else {
        setForm(DEFAULT_SERVICE_TAX_DETAILS);
      }
    } catch (err) {
      console.error("Failed to load service tax details:", err);
      setError("Failed to load saved service tax details.");
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
      const result = await window.api.serviceTaxDetails.save({
        ...form,
        company_id: companyId,
      });
      if (!result.success) throw new Error(result.error || "Database save failed");
      setSuccess("Service Tax Details saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      console.error("Failed to save service tax details:", err);
      setError(err instanceof Error ? err.message : "Failed to save service tax details.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, companyId]);

  return { form, setForm, setField, loading, error, setError, success, setSuccess, load, save };
}
