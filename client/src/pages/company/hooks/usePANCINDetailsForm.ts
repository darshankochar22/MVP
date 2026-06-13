import { useState, useEffect, useCallback, useRef } from "react";
import { useCompany } from "@/context/CompanyContext";
import { loadFormState, saveFormState, clearFormState } from "@/utils/formPersistence";

export interface PANCINFormData {
  pan_number: string;
  cin_number: string;
}

export const INITIAL_FORM: PANCINFormData = {
  pan_number: "",
  cin_number: "",
};

// PAN: 5 uppercase letters + 4 digits + 1 uppercase letter (e.g. PSMCE4926G)
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// CIN: 1 letter + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits (e.g. L84210TN2010PLC154983)
const CIN_REGEX = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

export function usePANCINDetailsForm() {
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;
  const persistKey = companyId ? `panCINDetails_${companyId}` : null;
  const hasRestored = useRef(false);

  const [form, setForm] = useState<PANCINFormData>(() => {
    if (persistKey) {
      const saved = loadFormState<any>(persistKey)?.form;
      if (saved) return saved;
    }
    return INITIAL_FORM;
  });

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  // Auto-save to sessionStorage
  useEffect(() => {
    if (!persistKey) return;
    if (!hasRestored.current) { hasRestored.current = true; return; }
    saveFormState(persistKey, { form });
  }, [persistKey, form]);

  // Load existing record on mount
  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      try {
        const result = await window.api.panCINDetails.getByCompany(companyId);
        if (result.success && result.panCINDetails) {
          const d = result.panCINDetails;
          setForm({
            pan_number: d.pan_number ?? "",
            cin_number: d.cin_number ?? "",
          });
        }
      } catch (_) {
        // no record yet — keep defaults
      }
    };
    load();
  }, [companyId]);

  const setField = (key: keyof PANCINFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value.toUpperCase() }));

  const validate = (): string | null => {
    if (!companyId) return "No company selected.";

    const pan = form.pan_number.trim().toUpperCase();
    if (pan) {
      if (pan.length !== 10)
        return "PAN must be exactly 10 characters (e.g. PSMCE4926G).";
      if (!PAN_REGEX.test(pan))
        return "Invalid PAN format. Expected: 5 letters + 4 digits + 1 letter (e.g. PSMCE4926G).";
    }

    const cin = form.cin_number.trim().toUpperCase();
    if (cin) {
      if (cin.length !== 21)
        return "CIN must be exactly 21 characters (e.g. L84210TN2010PLC154983).";
      if (!CIN_REGEX.test(cin))
        return "Invalid CIN format. Expected format: L84210TN2010PLC154983.";
    }

    return null;
  };

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    const validationError = validate();
    if (validationError) { setError(validationError); return false; }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        company_id: companyId,
        pan_number: form.pan_number.trim().toUpperCase() || null,
        cin_number: form.cin_number.trim().toUpperCase() || null,
      };
      const result = await window.api.panCINDetails.upsert(payload);
      if (result.success) {
        setSuccess("PAN / CIN Details saved successfully.");
        if (persistKey) clearFormState(persistKey);
        hasRestored.current = false;
        setTimeout(() => setSuccess(null), 2500);
        return true;
      } else {
        setError(result.error || "Failed to save PAN / CIN Details.");
        return false;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, companyId, persistKey]);

  return { form, loading, error, setError, success, setSuccess, setField, handleSubmit };
}
