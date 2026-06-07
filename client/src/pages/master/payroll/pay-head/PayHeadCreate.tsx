import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { FormRow, PageTitleBar, RightActionPanel, MasterFormFooter, AlertBanner } from "@/components/ui";
import PayHeadCalculationPanel from "@/components/payroll/PayHeadCalculationPanel";
import type { PayHeadFormulaLineType, PayHeadSlabLineType } from "@/types/entities/Payroll";
import { loadFormState, saveFormState, clearFormState } from "@/utils/formPersistence";
import { useMasterShortcuts } from "@/hooks/useMasterShortcuts";

const inputCls = "flex-1 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const selectCls = "bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded w-24";

const PAY_HEAD_TYPES = [
  "Earnings for Employees",
  "Deductions for Employees",
  "Employer Statutory Contributions",
  "Employer Statutory Deductions",
  "Reimbursements",
  "Gratuity",
];

const INCOME_TYPES = ["Fixed", "Variable"];

const CALCULATION_TYPES = [
  "As User Defined Value",
  "As Computed Value",
  "Flat Rate",
  "On Attendance",
  "On Production",
];

export default function PayHeadCreate() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;
  const persistKey = companyId ? `payHeadCreate_${companyId}` : null;
  const hasRestored = useRef(false);
  const persisted = persistKey ? loadFormState<any>(persistKey ?? "") : null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState(persisted?.name ?? "");
  const [alias, setAlias] = useState(persisted?.alias ?? "");
  const [pay_head_type, setPayHeadType] = useState(persisted?.pay_head_type ?? "Earnings for Employees");
  const [income_type, setIncomeType] = useState(persisted?.income_type ?? "Fixed");
  const [under_group, setUnderGroup] = useState(persisted?.under_group ?? "Direct Expenses");
  const [affects_net_salary, setAffectsNetSalary] = useState(persisted?.affects_net_salary ?? "Yes");
  const [payslip_display_name, setPayslipDisplayName] = useState(persisted?.payslip_display_name ?? "");
  const [use_for_gratuity, setUseForGratuity] = useState(persisted?.use_for_gratuity ?? "No");
  const [set_alter_income_tax, setSetAlterIncomeTax] = useState(persisted?.set_alter_income_tax ?? "No");
  const [calculation_type, setCalculationType] = useState(persisted?.calculation_type ?? "As User Defined Value");
  const [calculation_period, setCalculationPeriod] = useState(persisted?.calculation_period ?? "Months");
  const [percentage_or_amount, setPercentageOrAmount] = useState(persisted?.percentage_or_amount ?? 0);
  const [rounding_method, setRoundingMethod] = useState(persisted?.rounding_method ?? "Not Applicable");
  const [rounding_limit, setRoundingLimit] = useState(persisted?.rounding_limit ?? 0);
  const [compute_method, setComputeMethod] = useState(persisted?.compute_method ?? "On Current Earnings Total");

  const [slabs, setSlabs] = useState<PayHeadSlabLineType[]>(persisted?.slabs ?? []);
  const [formulaLines, setFormulaLines] = useState<PayHeadFormulaLineType[]>(persisted?.formulaLines ?? []);

  useEffect(() => {
    if (!persistKey) return;
    if (!hasRestored.current) {
      hasRestored.current = true;
      return;
    }
    saveFormState(persistKey, {
      name, alias, pay_head_type, income_type, under_group,
      affects_net_salary, payslip_display_name, use_for_gratuity,
      set_alter_income_tax, calculation_type, calculation_period,
      percentage_or_amount, rounding_method, rounding_limit, compute_method,
      slabs, formulaLines,
    });
  }, [persistKey, name, alias, pay_head_type, income_type, under_group, affects_net_salary, payslip_display_name, use_for_gratuity, set_alter_income_tax, calculation_type, calculation_period, percentage_or_amount, rounding_method, rounding_limit, compute_method, slabs, formulaLines]);

  const trueVal = (v: string) => v === "Yes" ? 1 : 0;

  const calcConfig = {
    calculation_type,
    calculation_period,
    percentage_or_amount,
    rounding_method,
    rounding_limit,
    compute_method,
  };

  const handleCalcChange = (key: keyof typeof calcConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.value;
    if (key === "calculation_type") setCalculationType(v);
    else if (key === "calculation_period") setCalculationPeriod(v);
    else if (key === "rounding_method") setRoundingMethod(v);
    else if (key === "compute_method") setComputeMethod(v);
  };

  const handleCalcNumberChange = (key: keyof typeof calcConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value === "" ? 0 : Number(e.target.value);
    if (key === "percentage_or_amount") setPercentageOrAmount(v);
    else if (key === "rounding_limit") setRoundingLimit(v);
  };

  const validate = (): string | null => {
    if (!name.trim()) return "Name is required.";
    if (!companyId) return "No company selected.";
    return null;
  };

  const handleSubmit = useCallback(async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError(null);
    try {
      const result = await window.api.payHead.create({
        company_id: companyId!,
        name: name.trim(),
        alias: alias.trim() || undefined,
        pay_head_type,
        income_type,
        under_group,
        affects_net_salary: trueVal(affects_net_salary),
        payslip_display_name: payslip_display_name.trim() || undefined,
        use_for_gratuity: trueVal(use_for_gratuity),
        set_alter_income_tax: trueVal(set_alter_income_tax),
        calculation_type,
        calculation_period,
        percentage_or_amount,
        rounding_method,
        rounding_limit,
      });

      if (result.success) {
        const pay_head_id = result.payHead.pay_head_id;
        if (pay_head_id && slabs.length > 0) {
          for (const slab of slabs) {
            await window.api.payHead.createSlab({ pay_head_id, effective_from: slab.effective_from, amount_gt: slab.amount_gt, amount_up_to: slab.amount_up_to, slab_type: slab.slab_type, value: slab.value });
          }
        }
        if (pay_head_id && formulaLines.length > 0) {
          for (let i = 0; i < formulaLines.length; i++) {
            await window.api.payHead.createFormula({ pay_head_id, sequence: i, function: formulaLines[i].function, pay_head_id_ref: formulaLines[i].pay_head_id_ref, operator: formulaLines[i].operator });
          }
        }
        setSuccess(`Pay Head "${name}" created.`);
        setName(""); setAlias(""); setPayslipDisplayName("");
        setSlabs([]); setFormulaLines([]);
        if (persistKey) clearFormState(persistKey);
        hasRestored.current = false;
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to create pay head.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, [name, alias, pay_head_type, income_type, under_group, affects_net_salary, payslip_display_name, use_for_gratuity, set_alter_income_tax, calculation_type, calculation_period, percentage_or_amount, rounding_method, rounding_limit, slabs, formulaLines, companyId, persistKey]);

  useMasterShortcuts({
    onAccept: handleSubmit,
    onQuit: () => navigate("/master/create"),
    onCreate: () => navigate("/master/alter/pay-head"),
  });

  const payHeadActions = [
    { key: "Alt+A", label: "Accept", onClick: handleSubmit },
    { key: "Alt+C", label: "Alter Mode", onClick: () => navigate("/master/alter/pay-head") },
    { key: "Esc", label: "Quit", onClick: () => navigate("/master/create") },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none">
      <PageTitleBar title="Pay Head Creation" subtitle={selectedCompany?.name} />

      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}
      {success && <AlertBanner type="success" message={success} onDismiss={() => setSuccess(null)} />}

      <div className="flex-1 flex min-h-0 overflow-x-auto">
        {/* Left: Basic info */}
        <div className="flex-1 flex flex-col min-w-0 shrink-0 bg-white">
          <div className="p-3 space-y-1.5">
            <FormRow label="Name" required labelWidth="w-44" className="flex items-center min-h-[26px]">
              <input autoFocus className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Basic Salary" />
            </FormRow>
            <FormRow label="(alias)" labelWidth="w-44" className="flex items-center min-h-[26px]">
              <input className={inputCls} value={alias} onChange={e => setAlias(e.target.value)} />
            </FormRow>
          </div>

          <div className="p-3 border-t border-zinc-100 space-y-1.5">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Pay Head Information</div>
            <FormRow label="Pay Head Type" labelWidth="w-44" className="flex items-center min-h-[26px]">
              <select className={selectCls} value={pay_head_type} onChange={e => setPayHeadType(e.target.value)}>
                {PAY_HEAD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormRow>
            <FormRow label="Income Type" labelWidth="w-44" className="flex items-center min-h-[26px]">
              <select className={selectCls} value={income_type} onChange={e => setIncomeType(e.target.value)}>
                {INCOME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormRow>
            <FormRow label="Under" labelWidth="w-44" className="flex items-center min-h-[26px]">
              <select className={selectCls} value={under_group} onChange={e => setUnderGroup(e.target.value)}>
                <option value="Direct Expenses">Direct Expenses</option>
                <option value="Indirect Expenses">Indirect Expenses</option>
                <option value="Current Liabilities">Current Liabilities</option>
                <option value="Current Assets">Current Assets</option>
                <option value="Direct Incomes">Direct Incomes</option>
                <option value="Indirect Incomes">Indirect Incomes</option>
              </select>
            </FormRow>
            <FormRow label="Affect Net Salary" labelWidth="w-44" className="flex items-center min-h-[26px]">
              <select className={selectCls} value={affects_net_salary} onChange={e => setAffectsNetSalary(e.target.value)}>
                <option>Yes</option>
                <option>No</option>
              </select>
            </FormRow>
            <FormRow label="Name to Display in Payslip" labelWidth="w-44" className="flex items-center min-h-[26px]">
              <input className={inputCls} value={payslip_display_name} onChange={e => setPayslipDisplayName(e.target.value)} />
            </FormRow>
            <FormRow label="Use for Gratuity" labelWidth="w-44" className="flex items-center min-h-[26px]">
              <select className={selectCls} value={use_for_gratuity} onChange={e => setUseForGratuity(e.target.value)}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </FormRow>
            <FormRow label="Set/Alter Income Tax Details" labelWidth="w-44" className="flex items-center min-h-[26px]">
              <select className={selectCls} value={set_alter_income_tax} onChange={e => setSetAlterIncomeTax(e.target.value)}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </FormRow>
          </div>

          <div className="p-3 border-t border-zinc-100 space-y-1.5">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Calculation Type</div>
            <FormRow label="Calculation Type" labelWidth="w-44" className="flex items-center min-h-[26px]">
              <select className={selectCls} value={calculation_type} onChange={e => setCalculationType(e.target.value)}>
                {CALCULATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormRow>
          </div>

          <PayHeadCalculationPanel
            config={calcConfig}
            slabs={slabs}
            formulaLines={formulaLines}
            companyId={companyId}
            onConfigChange={handleCalcChange}
            onConfigNumberChange={handleCalcNumberChange}
            onSlabAdd={() => setSlabs(s => [...s, { effective_from: "", amount_gt: 0, amount_up_to: 0, slab_type: "Percentage", value: 0 }])}
            onSlabDelete={(i) => setSlabs(s => s.filter((_, idx) => idx !== i))}
            onSlabChange={(i, field, value) => setSlabs(s => s.map((sl, idx) => idx === i ? { ...sl, [field]: value } : sl))}
            onFormulaAdd={(line) => setFormulaLines(f => [...f, { ...line, sequence: f.length }])}
            onFormulaDelete={(i) => setFormulaLines(f => f.filter((_, idx) => idx !== i))}
          />

          <div className="flex-1" />
        </div>

        {/* Total Opening Balance box */}
        <div className="w-56 border-l border-zinc-200 flex flex-col shrink-0 bg-zinc-50/25 p-3">
          <div className="w-full border border-zinc-200 rounded shrink-0 bg-white shadow-sm">
            <div className="text-center text-[10px] font-bold border-b border-zinc-100 py-1 bg-zinc-50 text-zinc-500 uppercase tracking-wider">Total Opening Balance</div>
            <div className="h-14 flex items-center justify-center text-sm font-semibold tabular-nums text-zinc-800">0.00</div>
          </div>
        </div>

        <RightActionPanel actions={payHeadActions} />
      </div>

      <MasterFormFooter
        onCancel={() => navigate("/master/create")}
        onSubmit={handleSubmit}
        submitLabel="Create"
        loading={loading}
      />
    </div>
  );
}
