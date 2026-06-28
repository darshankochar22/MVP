import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { PageTitleBar, RightActionPanel, MasterFormFooter } from "@/components/ui";
import { usePlaOpeningBalance } from "./usePlaOpeningBalance";
import { PlaOpeningBalanceForm } from "./PlaOpeningBalanceForm";

export default function PlaOpeningBalanceCreate() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;

  const {
    form,
    setField,
    loading,
    error,
    setError,
    success,
    setSuccess,
    save,
    gstRegistrationOptions,
    taxUnitOptions,
  } = usePlaOpeningBalance({ companyId });

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
      <PageTitleBar title="PLA Opening Balance" subtitle={selectedCompany?.name} />

      {error && (
        <div className="px-3 py-1.5 border-b border-zinc-300 bg-white text-zinc-800 text-xs flex justify-between items-center">
          <span className="font-bold">• {error}</span>
          <button onClick={() => setError(null)} className="text-zinc-500 hover:text-zinc-900 font-bold">&times;</button>
        </div>
      )}
      {success && (
        <div className="px-3 py-1.5 border-b border-zinc-300 bg-white text-zinc-800 text-xs flex justify-between items-center">
          <span className="font-bold">• {success}</span>
          <button onClick={() => setSuccess(null)} className="text-zinc-500 hover:text-zinc-900 font-bold">&times;</button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <PlaOpeningBalanceForm
          form={form}
          setField={setField}
          gstRegistrationOptions={gstRegistrationOptions}
          taxUnitOptions={taxUnitOptions}
          firstFieldAutoFocus
        />
        <RightActionPanel actions={actions} />
      </div>

      <MasterFormFooter onCancel={quit} onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
