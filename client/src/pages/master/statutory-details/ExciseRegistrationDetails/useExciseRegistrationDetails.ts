import { useState, useEffect, useCallback } from "react";
import {
  type ExciseRegistrationDetails,
  DEFAULT_EXCISE_REGISTRATION_DETAILS,
} from "@/types/entities/ExciseRegistrationDetails";

interface Props {
  companyId?: number;
}

export function useExciseRegistrationDetails({ companyId }: Props) {
  const [form, setForm] = useState<ExciseRegistrationDetails>(DEFAULT_EXCISE_REGISTRATION_DETAILS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setField = <K extends keyof ExciseRegistrationDetails>(
    key: K,
    value: ExciseRegistrationDetails[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.api.exciseRegistrationDetails.get(companyId);
      if (result.success && result.data) {
        setForm({ ...DEFAULT_EXCISE_REGISTRATION_DETAILS, ...result.data });
      } else {
        setForm(DEFAULT_EXCISE_REGISTRATION_DETAILS);
      }
    } catch (err) {
      console.error("Failed to load excise registration details:", err);
      setError("Failed to load saved excise registration details.");
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
      const result = await window.api.exciseRegistrationDetails.save({
        ...form,
        company_id: companyId,
      });
      if (!result.success) throw new Error(result.error || "Database save failed");
      setSuccess("Excise Registration Details saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      console.error("Failed to save excise registration details:", err);
      setError(err instanceof Error ? err.message : "Failed to save excise registration details.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, companyId]);

  return { form, setForm, setField, loading, error, setError, success, setSuccess, load, save };
}
