import { useState, useEffect, useCallback, useRef } from "react";
import { useCompany } from "@/context/CompanyContext";
import { loadFormState, saveFormState, clearFormState } from "@/utils/formPersistence";
import { INDIAN_STATES } from "@/constants/states";

export interface CompanyGSTFormData {
  gstin: string;
  registration_type: "Regular" | "Composition" | "Regular - SEZ" | "Unregistered";
  state_name: string;
  applicable_from: string;
  periodicity_of_gstr1: "Monthly" | "Quarterly";
  assessee_of_other_territory: "No" | "Yes";
  enable_e_invoice: "No" | "Yes";
  e_invoice_applicable_from: string;
  enable_e_way_bill: "No" | "Yes";
  e_way_bill_applicable_from: string;
  e_way_bill_for_intrastate: "No" | "Yes";
  hsn_sac_details: "Not Defined" | "Specify Details Here" | "Use GST Classification";
  hsn_sac: string;
  description: string;
  gst_rate_details: "Not Defined" | "Specify Details Here" | "Use GST Classification";
  taxability_type: string;
  gst_rate: string;
  hsn_summary_for: "All Sections" | "Value of Invoice";
  min_hsn_sac_length: string;
  show_gst_advances: "No" | "Yes";
  update_gst_on_master_alter: "No" | "Yes";
  set_alter_gst_return_details: "No" | "Yes";
}

export const INITIAL_FORM: CompanyGSTFormData = {
  gstin: "",
  registration_type: "Regular",
  state_name: INDIAN_STATES[0] || "",
  applicable_from: new Date().toISOString().split("T")[0],
  periodicity_of_gstr1: "Monthly",
  assessee_of_other_territory: "No",
  enable_e_invoice: "No",
  e_invoice_applicable_from: "",
  enable_e_way_bill: "No",
  e_way_bill_applicable_from: "",
  e_way_bill_for_intrastate: "No",
  hsn_sac_details: "Not Defined",
  hsn_sac: "",
  description: "",
  gst_rate_details: "Not Defined",
  taxability_type: "",
  gst_rate: "0",
  hsn_summary_for: "All Sections",
  min_hsn_sac_length: "4",
  show_gst_advances: "No",
  update_gst_on_master_alter: "No",
  set_alter_gst_return_details: "No",
};

export function useCompanyGSTDetailsForm() {
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;
  const persistKey = companyId ? `companyGSTDetails_${companyId}` : null;
  const hasRestored = useRef(false);

  const [form, setForm] = useState<CompanyGSTFormData>(() => {
    if (persistKey) {
      const saved = loadFormState<any>(persistKey)?.form;
      if (saved) return saved;
    }
    return INITIAL_FORM;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!persistKey) return;
    if (!hasRestored.current) { hasRestored.current = true; return; }
    saveFormState(persistKey, { form });
  }, [persistKey, form]);

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      try {
        const result = await window.api.companyGSTDetails.getByCompany(companyId);
        if (result.success && result.gstDetails) {
          const d = result.gstDetails;
          setForm({
            gstin: d.gstin ?? "",
            registration_type: (d.registration_type as any) ?? "Regular",
            state_name: d.state_name ?? (INDIAN_STATES[0] || ""),
            applicable_from: d.applicable_from ?? new Date().toISOString().split("T")[0],
            periodicity_of_gstr1: (d.periodicity_of_gstr1 as any) ?? "Monthly",
            assessee_of_other_territory: d.assessee_of_other_territory === 1 ? "Yes" : "No",
            enable_e_invoice: d.enable_e_invoice === 1 ? "Yes" : "No",
            e_invoice_applicable_from: d.e_invoice_applicable_from ?? "",
            enable_e_way_bill: d.enable_e_way_bill === 1 ? "Yes" : "No",
            e_way_bill_applicable_from: d.e_way_bill_applicable_from ?? "",
            e_way_bill_for_intrastate: d.e_way_bill_for_intrastate === 1 ? "Yes" : "No",
            hsn_sac_details: (d.hsn_sac_details as any) ?? "Not Defined",
            hsn_sac: d.hsn_sac ?? "",
            description: d.description ?? "",
            gst_rate_details: (d.gst_rate_details as any) ?? "Not Defined",
            taxability_type: d.taxability_type ?? "",
            gst_rate: d.gst_rate !== null && d.gst_rate !== undefined ? String(d.gst_rate) : "0",
            hsn_summary_for: (d.hsn_summary_for as any) ?? "All Sections",
            min_hsn_sac_length: d.min_hsn_sac_length !== null ? String(d.min_hsn_sac_length) : "4",
            show_gst_advances: d.show_gst_advances === 1 ? "Yes" : "No",
            update_gst_on_master_alter: d.update_gst_on_master_alter === 1 ? "Yes" : "No",
            set_alter_gst_return_details: d.set_alter_gst_return_details === 1 ? "Yes" : "No",
          });
        }
      } catch (e) {
        // no record yet — keep defaults
      }
    };
    load();
  }, [companyId]);

  const setField = (key: keyof CompanyGSTFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = (): string | null => {
    if (!companyId) return "No company selected.";
    if (form.gstin.trim()) {
      const pat = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (form.gstin.trim().length !== 15) return "GSTIN must be exactly 15 characters.";
      if (!pat.test(form.gstin.trim().toUpperCase())) return "Invalid GSTIN format.";
    }
    if (form.gst_rate && isNaN(parseFloat(form.gst_rate))) return "GST Rate must be a number.";
    if (form.min_hsn_sac_length && isNaN(parseInt(form.min_hsn_sac_length))) return "Min HSN/SAC length must be a number.";
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
        gstin: form.gstin.trim().toUpperCase() || null,
        registration_type: form.registration_type,
        state_name: form.state_name || null,
        applicable_from: form.applicable_from || null,
        periodicity_of_gstr1: form.periodicity_of_gstr1,
        assessee_of_other_territory: form.assessee_of_other_territory === "Yes" ? 1 : 0,
        enable_e_invoice: form.enable_e_invoice === "Yes" ? 1 : 0,
        e_invoice_applicable_from: form.enable_e_invoice === "Yes" ? (form.e_invoice_applicable_from || null) : null,
        enable_e_way_bill: form.enable_e_way_bill === "Yes" ? 1 : 0,
        e_way_bill_applicable_from: form.enable_e_way_bill === "Yes" ? (form.e_way_bill_applicable_from || null) : null,
        e_way_bill_for_intrastate: form.e_way_bill_for_intrastate === "Yes" ? 1 : 0,
        hsn_sac_details: form.hsn_sac_details,
        hsn_sac: form.hsn_sac.trim() || null,
        description: form.description.trim() || null,
        gst_rate_details: form.gst_rate_details,
        taxability_type: form.taxability_type || null,
        gst_rate: parseFloat(form.gst_rate) || 0,
        hsn_summary_for: form.hsn_summary_for,
        min_hsn_sac_length: parseInt(form.min_hsn_sac_length) || 4,
        show_gst_advances: form.show_gst_advances === "Yes" ? 1 : 0,
        update_gst_on_master_alter: form.update_gst_on_master_alter === "Yes" ? 1 : 0,
        set_alter_gst_return_details: form.set_alter_gst_return_details === "Yes" ? 1 : 0,
      };
      const result = await window.api.companyGSTDetails.upsert(payload);
      if (result.success) {
        setSuccess("Company GST Details saved successfully.");
        if (persistKey) clearFormState(persistKey);
        hasRestored.current = false;
        setTimeout(() => setSuccess(null), 2500);
        return true;
      } else {
        setError(result.error || "Failed to save Company GST Details.");
        return false;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [form, companyId, persistKey]);

  return { form, setForm, loading, error, setError, success, setSuccess, setField, handleSubmit };
}
