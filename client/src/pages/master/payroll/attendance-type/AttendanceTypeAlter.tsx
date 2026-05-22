import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { FormRow, PageTitleBar, SearchInput, DataTable } from "@/components/ui";
import type { AttendanceTypeType, PayrollUnitType } from "@/types/entities/Payroll";

const inputCls = "flex-1 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const selectCls = "bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const ATTENDANCE_TYPES = ["Attendance / Leave with Pay", "Leave without Pay", "Production", "User Defined Calendar Type"];

interface FormData { name: string; alias: string; type: string; unit_id: string; period: string; carry_forward: string; encashment: string; max_days: string; }

export default function AttendanceTypeAlter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;
  const [types, setTypes] = useState<AttendanceTypeType[]>([]);
  const [units, setUnits] = useState<PayrollUnitType[]>([]);
  const [selectedType, setSelectedType] = useState<AttendanceTypeType | null>(null);
  const [form, setForm] = useState<FormData>({ name: "", alias: "", type: "Attendance / Leave with Pay", unit_id: "", period: "Per Day", carry_forward: "0", encashment: "0", max_days: "0" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    const [tRes, uRes] = await Promise.all([window.api.attendanceType.getAll(companyId), window.api.payrollUnit.getAll(companyId)]);
    if (tRes.success) setTypes(tRes.attendanceTypes ?? []);
    if (uRes.success) setUnits(uRes.payrollUnits ?? []);
  }, [companyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSelect = (t: AttendanceTypeType) => {
    setSelectedType(t);
    setForm({ name: t.name, alias: t.alias || "", type: t.type || "Attendance / Leave with Pay", unit_id: t.unit_id ? String(t.unit_id) : "", period: t.period || "Per Day", carry_forward: t.carry_forward ? String(t.carry_forward) : "0", encashment: t.encashment ? String(t.encashment) : "0", max_days: t.max_days ? String(t.max_days) : "0" });
  };

  useEffect(() => {
    const preSelectId = (location.state as any)?.typeId;
    if (preSelectId && types.length > 0) {
      const t = types.find(t => t.attendance_type_id === preSelectId);
      if (t) handleSelect(t);
    }
  }, [location.state, types]);

  const setField = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = useCallback(async () => {
    if (!selectedType) return;
    setLoading(true); setError(null);
    try {
      const res = await window.api.attendanceType.update({ attendance_type_id: selectedType.attendance_type_id, name: form.name.trim(), alias: form.alias.trim() || undefined, type: form.type, unit_id: form.unit_id ? Number(form.unit_id) : undefined, period: form.period, carry_forward: Number(form.carry_forward), encashment: Number(form.encashment), max_days: Number(form.max_days) });
      if (res.success) { setSuccess(`"${form.name}" updated.`); await loadData(); setTimeout(() => { setSuccess(null); setSelectedType(null); }, 1500); }
      else setError(res.error || "Failed.");
    } catch (e) { setError(e instanceof Error ? e.message : "Error."); }
    finally { setLoading(false); }
  }, [form, selectedType, loadData]);

  const handleDelete = useCallback(async () => {
    if (!selectedType || selectedType.is_predefined) { setError("Cannot delete predefined type."); return; }
    setLoading(true); setError(null);
    try {
      const res = await window.api.attendanceType.delete(selectedType.attendance_type_id!);
      if (res.success) { setSuccess("Type deleted."); await loadData(); setTimeout(() => { setSuccess(null); setSelectedType(null); }, 1500); }
      else setError(res.error || "Failed.");
    } catch (e) { setError(e instanceof Error ? e.message : "Error."); }
    finally { setLoading(false); }
  }, [selectedType, loadData]);

  const selectableTypes = types.filter(t => !t.is_predefined);

  if (!selectedType) {
  const _selActions: any = []; void _selActions;
    return (
      <div className="flex-1 flex flex-col h-full bg-white select-none">
        <PageTitleBar title="Alter Attendance Type" subtitle="Select Type to Alter" />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <SearchInput value="" onChange={() => {}} placeholder="Filter types..." />
            <div className="flex-1 overflow-y-auto">
              <DataTable columns={[{ key: "name", label: "Name", span: "col-span-4", render: (r: AttendanceTypeType) => <span className="font-medium">{r.name}</span> }, { key: "type", label: "Type", span: "col-span-4", render: (r: AttendanceTypeType) => <span className="text-zinc-500">{r.type}</span> }, { key: "period", label: "Period", span: "col-span-4", render: (r: AttendanceTypeType) => <span className="text-zinc-400">{r.period || "-"}</span> }]} rows={selectableTypes} rowKey={(r) => String(r.attendance_type_id)} onRowClick={handleSelect} />
            </div>
          </div>
        </div>
        <div className="border-t p-3 bg-zinc-50"><button onClick={() => navigate("/master/alter")} className="text-xs text-zinc-500">&larr; Back</button></div>
      </div>
    );
  }

  const _editActions: any = []; void _editActions;

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none">
      <PageTitleBar title="Alter Attendance Type" subtitle={selectedCompany?.name} />
      {error && (<div className="px-3 py-1.5 border-b border-red-200 bg-red-50 text-red-700 text-xs flex justify-between"><span>* {error}</span><button onClick={() => setError(null)} className="text-red-500 font-bold">&times;</button></div>)}
      {success && (<div className="px-3 py-1.5 border-b border-green-200 bg-green-50 text-green-700 text-xs flex justify-between"><span>* {success}</span><button onClick={() => setSuccess(null)} className="text-green-500 font-bold">&times;</button></div>)}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0 bg-white border-r">
          <div className="p-3 space-y-1 max-w-2xl">
            <FormRow label="Name" required labelWidth="w-56"><input className={inputCls} value={form.name} onChange={setField("name")} /></FormRow>
            <FormRow label="(alias)" labelWidth="w-56"><input className={inputCls} value={form.alias} onChange={setField("alias")} /></FormRow>
            <FormRow label="Under" labelWidth="w-56"><span className="text-sm font-semibold text-zinc-800">Primary</span></FormRow>
            <FormRow label="Attendance Type" labelWidth="w-56"><select className={selectCls} value={form.type} onChange={setField("type")}>{ATTENDANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></FormRow>
            <FormRow label="Period" labelWidth="w-56"><select className={selectCls} value={form.period} onChange={setField("period")}><option value="Per Day">Per Day</option><option value="Per Month">Per Month</option><option value="Per Year">Per Year</option><option value="Per Hour">Per Hour</option></select></FormRow>
            <FormRow label="Unit" labelWidth="w-56"><select className={selectCls} value={form.unit_id} onChange={setField("unit_id")}><option value="">Select</option>{units.map(u => <option key={u.payroll_unit_id} value={u.payroll_unit_id}>{u.name}</option>)}</select></FormRow>
          </div>
          <div className="flex-1" />
        </div>
      </div>
      <div className="border-t p-3 flex justify-between bg-zinc-50">
        <div className="flex gap-2"><button onClick={() => setSelectedType(null)} className="text-xs text-zinc-500">&larr; Back</button>{!selectedType?.is_predefined && <button onClick={handleDelete} disabled={loading} className="text-xs text-red-500 font-medium">Delete</button>}</div>
        <button onClick={handleSubmit} disabled={loading} className="text-sm px-6 py-1.5 rounded bg-black text-white hover:bg-zinc-800 disabled:opacity-50">{loading ? "Saving..." : "Accept"}</button>
      </div>
    </div>
  );
}
