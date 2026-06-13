import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { PageTitleBar, RightActionPanel } from "@/components/ui";
import { usePANCINDetailsForm } from "./hooks/usePANCINDetailsForm";

// ── helpers ──────────────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center min-h-[30px]">
      <span className="w-64 text-zinc-700 font-medium text-[11px]">{label}</span>
      <span className="text-zinc-400 mr-4 font-medium text-[11px]">:</span>
      <div className="flex-1 flex items-center">{children}</div>
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function PANCINDetails() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();

  const {
    form,
    loading,
    error,
    setError,
    success,
    setSuccess,
    setField,
    handleSubmit,
  } = usePANCINDetailsForm();

  const handleSave = async () => { await handleSubmit(); };

  // Keyboard shortcuts — same pattern as rest of codebase
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); navigate("/master/create"); }
      if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, navigate]);

  const actions = [
    { key: "Alt+A", label: "Accept", onClick: handleSave },
    { key: "Esc",   label: "Quit",   onClick: () => navigate("/master/create") },
  ];

  const INPUT_CLS =
    "border border-zinc-200 hover:border-zinc-400 focus:border-zinc-800 " +
    "rounded px-2 py-0.5 outline-none bg-white w-64 text-[11px] font-bold " +
    "text-zinc-950 tracking-wider uppercase font-mono";

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-white select-none">
      <PageTitleBar title="PAN / CIN Details" subtitle={selectedCompany?.name} />

      {/* Error banner */}
      {error && (
        <div className="px-3 py-1.5 border-b border-red-200 bg-red-50 text-red-700 text-xs flex justify-between items-center shrink-0 font-sans">
          <span>• {error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="px-3 py-1.5 border-b border-green-200 bg-green-50 text-green-700 text-xs flex justify-between items-center shrink-0 font-sans">
          <span>• {success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700 font-bold">&times;</button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex min-h-0">

        {/* Form panel */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 font-mono text-zinc-800 text-[11px]">
          <div className="max-w-2xl mx-auto bg-white border border-zinc-200 rounded shadow-sm p-8">

            {/* Screen title */}
            <div className="text-center font-bold text-xs border-b border-zinc-200 pb-3 mb-8 tracking-wide text-zinc-900 uppercase">
              PAN / CIN Details
            </div>

            <div className="space-y-4">

              {/* PAN */}
              <FieldRow label="PAN/Income tax no.">
                <div className="flex flex-col gap-1">
                  <input
                    className={INPUT_CLS}
                    placeholder="e.g. PSMCE4926G"
                    value={form.pan_number}
                    onChange={setField("pan_number")}
                    maxLength={10}
                    autoFocus
                  />
                  <span className="text-zinc-400 text-[9px] font-sans normal-case tracking-normal">
                    10 characters: 5 letters + 4 digits + 1 letter
                  </span>
                </div>
              </FieldRow>

              {/* CIN */}
              <FieldRow label="Corporate Identity No. (CIN)">
                <div className="flex flex-col gap-1">
                  <input
                    className={INPUT_CLS}
                    placeholder="e.g. L84210TN2010PLC154983"
                    value={form.cin_number}
                    onChange={setField("cin_number")}
                    maxLength={21}
                  />
                  <span className="text-zinc-400 text-[9px] font-sans normal-case tracking-normal">
                    21 characters: e.g. L84210TN2010PLC154983
                  </span>
                </div>
              </FieldRow>

            </div>

            {/* Inline format hints */}
            <div className="mt-8 border-t border-zinc-100 pt-4 space-y-1 text-[10px] text-zinc-400 font-sans">
              <div><span className="font-semibold text-zinc-500">PAN format:</span> AAAAA9999A — 5 uppercase letters, 4 digits, 1 uppercase letter</div>
              <div><span className="font-semibold text-zinc-500">CIN format:</span> L99999AA9999AAA999999 — issued by Ministry of Corporate Affairs</div>
            </div>

          </div>
        </div>

        <RightActionPanel actions={actions} />
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-zinc-200 flex justify-end bg-zinc-50 shrink-0">
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/master/create")}
            className="text-xs px-4 py-1.5 rounded border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 shadow-sm transition-colors font-medium font-sans"
          >
            Quit
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-xs px-5 py-1.5 rounded bg-black text-white hover:bg-zinc-800 disabled:opacity-50 shadow-sm transition-colors font-medium font-sans"
          >
            {loading ? "Saving..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
