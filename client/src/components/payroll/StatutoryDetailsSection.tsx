import { FormRow } from "@/components/ui";

const inputCls = "flex-1 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const selectCls = "bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

export interface StatutoryDetailsData {
  applicable_tax_regime?: string;
  pan?: string;
  aadhaar?: string;
  uan?: string;
  pf_account_number?: string;
  eps_account_number?: string;
  date_of_joining_pf?: string;
  pran?: string;
  esi_number?: string;
  esi_dispensary_name?: string;
}

interface Props {
  data: StatutoryDetailsData;
  onChange: (key: keyof StatutoryDetailsData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function StatutoryDetailsSection({ data, onChange }: Props) {
  return (
    <div className="p-3 border-t border-zinc-100 bg-white">
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Statutory Details</div>
      <div className="space-y-1">
        <FormRow label="Applicable Tax Regime" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <select className={selectCls} value={data.applicable_tax_regime || "New Tax Regime"} onChange={onChange("applicable_tax_regime")}>
            <option value="New Tax Regime">New Tax Regime</option>
            <option value="Old Tax Regime">Old Tax Regime</option>
          </select>
        </FormRow>
        <FormRow label="Income Tax Number (PAN)" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.pan || ""} onChange={onChange("pan")} />
        </FormRow>
        <FormRow label="Aadhaar Number" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.aadhaar || ""} onChange={onChange("aadhaar")} />
        </FormRow>
        <FormRow label="Universal Account Number (UAN)" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.uan || ""} onChange={onChange("uan")} />
        </FormRow>
        <FormRow label="PF Account Number" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.pf_account_number || ""} onChange={onChange("pf_account_number")} />
        </FormRow>
        <FormRow label="EPS Account Number" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.eps_account_number || ""} onChange={onChange("eps_account_number")} />
        </FormRow>
        <FormRow label="Date of Joining for PF" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input type="date" className={inputCls} value={data.date_of_joining_pf || ""} onChange={onChange("date_of_joining_pf")} />
        </FormRow>
        <FormRow label="PR Account Number (PRAN)" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.pran || ""} onChange={onChange("pran")} />
        </FormRow>
        <FormRow label="ESI Number" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.esi_number || ""} onChange={onChange("esi_number")} />
        </FormRow>
        <FormRow label="ESI Dispensary Name" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={data.esi_dispensary_name || ""} onChange={onChange("esi_dispensary_name")} />
        </FormRow>
      </div>
    </div>
  );
}
