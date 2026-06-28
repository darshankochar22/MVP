import { useState, useEffect, useCallback } from "react";
import {
  type VATRegistrationDetails,
  DEFAULT_VAT_REGISTRATION_DETAILS,
} from "@/types/entities/VATRegistrationDetails";

interface Props {
  companyId?: number;
}

export function useVATRegistrationDetails({ companyId }: Props) {
  const [form, setForm] = useState<VATRegistrationDetails>(DEFAULT_VAT_REGISTRATION_DETAILS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setField = <K extends keyof VATRegistrationDetails>(
    key: K,
    value: VATRegistrationDetails[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.api.vatRegistrationDetails.get(companyId);
      if (result.success && result.data) {
        setForm({ ...DEFAULT_VAT_REGISTRATION_DETAILS, ...result.data });
      } else {
        setForm(DEFAULT_VAT_REGISTRATION_DETAILS);
      }
    } catch (err) {
      console.error("Failed to load VAT registration details:", err);
      setError("Failed to load saved VAT registration details.");
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
      const result = await window.api.vatRegistrationDetails.save({
        ...form,
        company_id: companyId,
      });
      if (!result.success) throw new Error(result.error || "Database save failed");
      setSuccess("VAT Registration Details saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      console.error("Failed to save VAT registration details:", err);
      setError(err instanceof Error ? err.message : "Failed to save VAT registration details.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, companyId]);

  return { form, setForm, setField, loading, error, setError, success, setSuccess, load, save };
}
