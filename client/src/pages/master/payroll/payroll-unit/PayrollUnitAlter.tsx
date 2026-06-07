import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { FormRow, PageTitleBar, MasterSelectionPanel, MasterFormFooter, AlertBanner } from "@/components/ui";
import { useMasterShortcuts } from "@/hooks/useMasterShortcuts";
import type { PayrollUnitType } from "@/types/entities/Payroll";

const inputCls = "flex-1 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const selectCls = "bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

interface FormData { unit_type: string; symbol: string; formal_name: string; decimal_places: string; first_unit: string; conversion: string; second_unit: string; }

export default function PayrollUnitAlter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;
  const [units, setUnits] = useState<PayrollUnitType[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<PayrollUnitType | null>(null);
  const [form, setForm] = useState<FormData>({ unit_type: "Simple", symbol: "", formal_name: "", decimal_places: "0", first_unit: "", conversion: "", second_unit: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadUnits = useCallback(async () => {
    if (!companyId) return;
    const res = await window.api.payrollUnit.getAll(companyId);
    if (res.success) setUnits(res.payrollUnits ?? []);
  }, [companyId]);

  useEffect(() => { loadUnits(); }, [loadUnits]);

  const handleSelectUnit = (u: PayrollUnitType) => {
    setSelectedUnit(u);
    setForm({ unit_type: u.unit_type || "Simple", symbol: u.symbol || "", formal_name: u.formal_name || "", decimal_places: String(u.decimal_places ?? 0), first_unit: u.first_unit || "", conversion: u.conversion != null ? String(u.conversion) : "", second_unit: u.second_unit || "" });
  };

  useEffect(() => {
    const preSelectId = (location.state as any)?.unitId;
    if (preSelectId && units.length > 0) {
      const u = units.find(u => u.payroll_unit_id === preSelectId);
      if (u) handleSelectUnit(u);
    }
  }, [location.state, units]);

  const setField = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = useCallback(async () => {
    if (!selectedUnit) return;
    setLoading(true); setError(null);
    try {
      const res = await window.api.payrollUnit.update({ payroll_unit_id: selectedUnit.payroll_unit_id, name: form.symbol.trim(), symbol: form.symbol.trim(), formal_name: form.formal_name.trim() || undefined, unit_type: form.unit_type, decimal_places: Number(form.decimal_places) || 0, first_unit: form.unit_type === "Compound" ? form.first_unit || undefined : undefined, conversion: form.unit_type === "Compound" && form.conversion ? Number(form.conversion) : undefined, second_unit: form.unit_type === "Compound" ? form.second_unit || undefined : undefined });
      if (res.success) { setSuccess(`Unit "${form.symbol}" updated.`); await loadUnits(); setTimeout(() => { setSuccess(null); setSelectedUnit(null); }, 1500); }
      else setError(res.error || "Failed.");
    } catch (e) { setError(e instanceof Error ? e.message : "Error."); }
    finally { setLoading(false); }
  }, [form, selectedUnit, loadUnits]);

  const handleDelete = useCallback(async () => {
    if (!selectedUnit || selectedUnit.is_predefined) { setError("Cannot delete predefined unit."); return; }
    setLoading(true); setError(null);
    try {
      const res = await window.api.payrollUnit.delete(selectedUnit.payroll_unit_id!);
      if (res.success) { setSuccess("Unit deleted."); await loadUnits(); setTimeout(() => { setSuccess(null); setSelectedUnit(null); }, 1500); }
      else setError(res.error || "Failed.");
    } catch (e) { setError(e instanceof Error ? e.message : "Error."); }
    finally { setLoading(false); }
  }, [selectedUnit, loadUnits]);

  useMasterShortcuts({
    onAccept: handleSubmit,
    onDelete: selectedUnit && !selectedUnit.is_predefined ? handleDelete : undefined,
    onQuit: () => {
      if (selectedUnit) setSelectedUnit(null);
      else navigate("/master/alter");
    },
  });

  if (!selectedUnit) {
    const columns = [
      {
        key: "symbol",
        label: "Symbol",
        span: "col-span-4",
        render: (r: PayrollUnitType) => <span className="font-bold text-zinc-950 uppercase">{r.symbol}</span>,
      },
      {
        key: "formal_name",
        label: "Formal Name",
        span: "col-span-5",
        render: (r: PayrollUnitType) => <span className="text-zinc-600">{r.formal_name || "—"}</span>,
      },
      {
        key: "unit_type",
        label: "Type",
        span: "col-span-3",
        render: (r: PayrollUnitType) => <span className="text-zinc-400 uppercase text-[10px]">{r.unit_type || "Simple"}</span>,
      },
    ];

    return (
      <MasterSelectionPanel
        title="Alter Payroll Unit"
        subtitle="Select Unit to Alter"
        searchPlaceholder="Search units by symbol or name…"
        items={units}
        filterFn={(u, search) =>
          u.symbol.toLowerCase().includes(search.toLowerCase()) ||
          (u.formal_name && u.formal_name.toLowerCase().includes(search.toLowerCase()))
        }
        columns={columns}
        onSelect={handleSelectUnit}
        onCancel={() => navigate("/master/alter")}
        onCreate={() => navigate("/master/create/payroll-unit")}
        createLabel="Create Unit"
        rowKey={(r) => String(r.payroll_unit_id)}
        emptyMessage="No payroll units found."
      />
    );
  }

  const _editActions: any = []; void _editActions;

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none">
      <PageTitleBar title="Alter Payroll Unit" subtitle={selectedCompany?.name} />
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}
      {success && <AlertBanner type="success" message={success} onDismiss={() => setSuccess(null)} />}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0 bg-white border-r">
          <div className="p-3 space-y-1 max-w-2xl">
            <FormRow label="Type" labelWidth="w-56"><select className={selectCls} value={form.unit_type} onChange={setField("unit_type")}><option value="Simple">Simple</option><option value="Compound">Compound</option></select></FormRow>
            <FormRow label="Symbol" required labelWidth="w-56"><input className={inputCls} value={form.symbol} onChange={setField("symbol")} /></FormRow>
            <FormRow label="Formal Name" labelWidth="w-56"><input className={inputCls} value={form.formal_name} onChange={setField("formal_name")} /></FormRow>
            <FormRow label="Decimal Places" labelWidth="w-56"><select className={selectCls} value={form.decimal_places} onChange={setField("decimal_places")}>{[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}</select></FormRow>
            {form.unit_type === "Compound" && (
              <div className="pt-2 mt-2 border-t border-zinc-100 space-y-1">
                <div className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Compound Unit</div>
                <FormRow label="First Unit" labelWidth="w-56"><input className={inputCls} value={form.first_unit} onChange={setField("first_unit")} /></FormRow>
                <FormRow label="Conversion" labelWidth="w-56"><input className={inputCls} value={form.conversion} onChange={setField("conversion")} /></FormRow>
                <FormRow label="Second Unit" labelWidth="w-56"><input className={inputCls} value={form.second_unit} onChange={setField("second_unit")} /></FormRow>
              </div>
            )}
          </div>
          <div className="flex-1" />
        </div>
      </div>
      <MasterFormFooter
        onCancel={() => setSelectedUnit(null)}
        onSubmit={handleSubmit}
        onDelete={!selectedUnit.is_predefined ? handleDelete : undefined}
        submitLabel="Accept"
        cancelLabel="Back"
        loading={loading}
      />
    </div>
  );
}
