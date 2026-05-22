import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { FormRow, PageTitleBar, SearchInput, DataTable } from "@/components/ui";
import type { EmployeeGroupType } from "@/types/entities/Employee";

const inputCls = "flex-1 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

export default function EmployeeGroupAlter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;
  const [groups, setGroups] = useState<EmployeeGroupType[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<EmployeeGroupType | null>(null);
  const [form, setForm] = useState<{ name: string; alias: string; parent_group_id: number | null }>({ name: "", alias: "", parent_group_id: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [selectedParent, setSelectedParent] = useState<EmployeeGroupType | null>(null);

  const loadGroups = useCallback(async () => {
    if (!companyId) return;
    const res = await window.api.employeeGroup.getAll(companyId);
    if (res.success) setGroups(res.employeeGroups ?? []);
  }, [companyId]);
  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleSelectGroup = (g: EmployeeGroupType) => {
    setSelectedGroup(g);
    setForm({ name: g.name, alias: g.alias || "", parent_group_id: g.parent_group_id ?? null });
    const parent = groups.find(p => p.employee_group_id === g.parent_group_id);
    setSelectedParent(parent || null);
  };

  useEffect(() => {
    const preSelectId = (location.state as any)?.groupId;
    if (preSelectId && groups.length > 0) {
      const g = groups.find(g => g.employee_group_id === preSelectId);
      if (g) handleSelectGroup(g);
    }
  }, [location.state, groups]);

  const setField = (key: "name" | "alias") => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = useCallback(async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!selectedGroup) return;
    setLoading(true); setError(null);
    try {
      const res = await window.api.employeeGroup.update({ employee_group_id: selectedGroup.employee_group_id, name: form.name.trim(), alias: form.alias.trim() || undefined, parent_group_id: form.parent_group_id || undefined });
      if (res.success) {
        setSuccess(`Group "${form.name}" updated.`);
        await loadGroups();
        setTimeout(() => { setSuccess(null); setSelectedGroup(null); }, 1500);
      } else setError(res.error || "Failed.");
    } catch (e) { setError(e instanceof Error ? e.message : "Error."); }
    finally { setLoading(false); }
  }, [form, selectedGroup, loadGroups]);

  const handleDelete = useCallback(async () => {
    if (!selectedGroup) return;
    if (selectedGroup.is_predefined) { setError("Cannot delete predefined group."); return; }
    setLoading(true); setError(null);
    try {
      const res = await window.api.employeeGroup.delete(selectedGroup.employee_group_id!);
      if (res.success) {
        setSuccess("Group deleted.");
        await loadGroups();
        setTimeout(() => { setSuccess(null); setSelectedGroup(null); }, 1500);
      } else setError(res.error || "Failed.");
    } catch (e) { setError(e instanceof Error ? e.message : "Error."); }
    finally { setLoading(false); }
  }, [selectedGroup, loadGroups]);

  const buildTree = (parentId: number | null): (EmployeeGroupType & { children?: EmployeeGroupType[] })[] => {
    return groups
      .filter(g => g.parent_group_id === parentId && g.employee_group_id !== selectedGroup?.employee_group_id)
      .map(g => ({ ...g, children: buildTree(g.employee_group_id ?? null) }));
  };

  const renderTree = (nodes: (EmployeeGroupType & { children?: EmployeeGroupType[] })[], depth: number = 0) => {
    return nodes.map(node => (
      <div key={node.employee_group_id}>
        <button className="w-full text-left px-2 py-1 text-sm hover:bg-zinc-100 rounded" style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => { setForm(f => ({ ...f, parent_group_id: node.employee_group_id ?? null })); setSelectedParent(node); setShowGroupPanel(false); }}>
          {node.name}
        </button>
        {node.children?.length > 0 && renderTree(node.children, depth + 1)}
      </div>
    ));
  };

  const selectableGroups = groups.filter(g => !g.is_predefined);

  if (!selectedGroup) {
    const selectionActions: any = [];
    void selectionActions;
    return (
      <div className="flex-1 flex flex-col h-full bg-white select-none">
        <PageTitleBar title="Alter Employee Group" subtitle="Select Group to Alter" />
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <SearchInput value="" onChange={() => {}} placeholder="Filter groups..." />
            <div className="flex-1 overflow-y-auto">
              <DataTable columns={[{ key: "name", label: "Group Name", span: "col-span-8", render: (r: EmployeeGroupType) => <span className="font-medium">{r.name}</span> }, { key: "alias", label: "Alias", span: "col-span-4", render: (r: EmployeeGroupType) => <span className="text-zinc-500">{r.alias || "-"}</span> }]} rows={selectableGroups} rowKey={(r) => String(r.employee_group_id)} onRowClick={handleSelectGroup} />
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-200 p-3 flex justify-between bg-zinc-50"><button onClick={() => navigate("/master/alter")} className="text-xs text-zinc-500">&larr; Back</button></div>
      </div>
    );
  }

  const editActions: any = [];
  void editActions;
  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none">
      <PageTitleBar title="Alter Employee Group" subtitle={selectedCompany?.name} />
      {error && (<div className="px-3 py-1.5 border-b border-red-200 bg-red-50 text-red-700 text-xs flex justify-between items-center"><span>* {error}</span><button onClick={() => setError(null)} className="text-red-500 font-bold">&times;</button></div>)}
      {success && (<div className="px-3 py-1.5 border-b border-green-200 bg-green-50 text-green-700 text-xs flex justify-between items-center"><span>* {success}</span><button onClick={() => setSuccess(null)} className="text-green-500 font-bold">&times;</button></div>)}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-zinc-100">
          <div className="p-3 space-y-1 max-w-2xl">
            <FormRow label="Name" required labelWidth="w-56"><input className={inputCls} value={form.name} onChange={setField("name")} /></FormRow>
            <FormRow label="(alias)" labelWidth="w-56"><input className={inputCls} value={form.alias} onChange={setField("alias")} /></FormRow>
            <div className="flex items-center min-h-[26px] cursor-pointer hover:bg-zinc-100/60 px-2 py-0.5 rounded" onClick={() => setShowGroupPanel(!showGroupPanel)}>
              <span className="w-20 text-sm shrink-0 font-medium text-zinc-500">Under</span><span className="text-zinc-400 mr-2">:</span>
              <span className="text-sm font-semibold text-zinc-800 underline decoration-dotted">{selectedParent?.name || "Primary"}</span>
            </div>
          </div>
          <div className="flex-1" />
        </div>
        {showGroupPanel && (
          <div className="w-72 border-l border-zinc-200 flex flex-col shrink-0 bg-white">
            <div className="px-3 py-2 border-b bg-zinc-50 text-xs font-bold text-zinc-500 uppercase flex justify-between"><span>List of Employee Groups</span><button onClick={() => setShowGroupPanel(false)} className="text-sm font-bold text-zinc-400">&times;</button></div>
            <div className="flex-1 overflow-y-auto">
              <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 font-medium" onClick={() => { setForm(f => ({ ...f, parent_group_id: null })); setSelectedParent(null); setShowGroupPanel(false); }}>Primary</button>
              {renderTree(buildTree(null))}
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-zinc-200 p-3 flex justify-between items-center bg-zinc-50">
        <div className="flex gap-2">
          <button onClick={() => setSelectedGroup(null)} className="text-xs text-zinc-500 hover:text-zinc-800">&larr; Back</button>
          {!selectedGroup.is_predefined && <button onClick={handleDelete} disabled={loading} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>}
        </div>
        <button onClick={handleSubmit} disabled={loading} className="text-sm px-6 py-1.5 rounded bg-black text-white hover:bg-zinc-800 disabled:opacity-50">{loading ? "Saving..." : "Accept"}</button>
      </div>
    </div>
  );
}
