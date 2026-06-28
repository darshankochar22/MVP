import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { PageTitleBar, RightActionPanel, MasterFormFooter, AlertBanner } from "@/components/ui";
import { useExciseOpeningBalance } from "./useExciseOpeningBalance";
import { ExciseOpeningBalanceForm } from "./ExciseOpeningBalanceForm";

export default function ExciseOpeningBalanceCreate() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;

  const { form, setField, loading, error, setError, success, setSuccess, save } =
    useExciseOpeningBalance({ companyId });

  const quit = useCallback(() => navigate("/master/create"), [navigate]);

  const handleSubmit = useCallback(async () => {
    await save();
  }, [save]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); quit(); }
      if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === "a") { e.preventDefault(); handleSubmit(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, quit]);

  const actions = [
    { key: "Alt+A", label: "Accept", onClick: handleSubmit },
    { key: "Esc",   label: "Quit",   onClick: quit },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none">
      <PageTitleBar title="Excise Opening Balance" subtitle={selectedCompany?.name} />

      {error && (
        <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />
      )}
      {success && (
        <AlertBanner type="success" message={success} onDismiss={() => setSuccess(null)} />
      )}

      <div className="flex-1 flex min-h-0">
        <ExciseOpeningBalanceForm form={form} setField={setField} firstFieldAutoFocus />
        <RightActionPanel actions={actions} />
      </div>

      <MasterFormFooter onCancel={quit} onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
