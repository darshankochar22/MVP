import { FormRow } from "@/components/ui";

const inputCls = "flex-1 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const selectCls = "bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

export interface BankDetailsData {
  bank_account_number?: string;
  bank_name?: string;
  bank_branch?: string;
  ifsc_code?: string;
}

interface Props {
  data: BankDetailsData;
  provideBank: "No" | "Yes";
  onProvideChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onChange: (key: keyof BankDetailsData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export default function BankDetailsSection({ data, provideBank, onProvideChange, onChange }: Props) {
  return (
    <div className="p-3 border-t border-zinc-100 bg-white">
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Bank Details</div>
      <FormRow label="Provide bank details" labelWidth="w-44" className="flex items-center min-h-[26px]">
        <select className={selectCls} value={provideBank} onChange={onProvideChange}>
          <option>No</option>
          <option>Yes</option>
        </select>
      </FormRow>
      {provideBank === "Yes" && (
        <div className="mt-2 pl-3 border-l-2 border-zinc-200 space-y-1">
          <FormRow label="Bank Name" labelWidth="w-40" className="flex items-center min-h-[26px]">
            <input className={inputCls} value={data.bank_name || ""} onChange={onChange("bank_name")} />
          </FormRow>
          <FormRow label="Branch" labelWidth="w-40" className="flex items-center min-h-[26px]">
            <input className={inputCls} value={data.bank_branch || ""} onChange={onChange("bank_branch")} />
          </FormRow>
          <FormRow label="Account Number" labelWidth="w-40" className="flex items-center min-h-[26px]">
            <input className={inputCls} value={data.bank_account_number || ""} onChange={onChange("bank_account_number")} />
          </FormRow>
          <FormRow label="IFSC Code" labelWidth="w-40" className="flex items-center min-h-[26px]">
            <input className={inputCls} value={data.ifsc_code || ""} onChange={onChange("ifsc_code")} />
          </FormRow>
        </div>
      )}
    </div>
  );
}
