import { FormRow } from "@/components/ui";
import type { BankDetails } from "./BankDetailsPopup";

const inputCls = "flex-1 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const selectCls = "bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

interface LedgerBankDetailsFormProps {
  bankForm: BankDetails;
  setBankField: (key: keyof BankDetails) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  groupLineage: {
    isBank: boolean;
  };
}

export default function LedgerBankDetailsForm({
  bankForm,
  setBankField,
  groupLineage,
}: LedgerBankDetailsFormProps) {
  if (!groupLineage.isBank) return null;

  return (
    <div className="p-3 border-t border-zinc-100 bg-white space-y-1.5">
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Bank Account Details</div>
      <FormRow label="A/c No." labelWidth="w-44" className="flex items-center min-h-[26px]">
        <input className={inputCls} value={bankForm.account_number || ""} onChange={setBankField("account_number")} />
      </FormRow>
      <FormRow label="IFS Code" labelWidth="w-44" className="flex items-center min-h-[26px]">
        <input className={inputCls} value={bankForm.ifsc_code || ""} onChange={setBankField("ifsc_code")} />
      </FormRow>
      <FormRow label="Bank Name" labelWidth="w-44" className="flex items-center min-h-[26px]">
        <input className={inputCls} value={bankForm.bank_name || ""} onChange={setBankField("bank_name")} />
      </FormRow>
      <FormRow label="Company Bank" labelWidth="w-44" className="flex items-center min-h-[26px]">
        <input className={inputCls} value={bankForm.company_bank || ""} onChange={setBankField("company_bank")} />
      </FormRow>
      <FormRow label="Beneficiary Code" labelWidth="w-44" className="flex items-center min-h-[26px]">
        <input className={inputCls} value={bankForm.beneficiary_code || ""} onChange={setBankField("beneficiary_code")} />
      </FormRow>

      <div className="pt-2 border-t border-zinc-100 my-2" />
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Transaction Details</div>

      <FormRow label="Transaction Type" labelWidth="w-44" className="flex items-center min-h-[26px]">
        <select
          className={selectCls}
          value={bankForm.transaction_type || ""}
          onChange={setBankField("transaction_type")}
        >
          <option value="">— Select —</option>
          <option>Cheque</option>
          <option>e-Fund Transfer</option>
          <option>ATM</option>
          <option>Card</option>
          <option>ECS</option>
          <option>Electronic Cheque</option>
          <option>Electronic DD/PO</option>
          <option>Others</option>
        </select>
      </FormRow>

      {bankForm.transaction_type === "Cheque" && (
        <FormRow label="Cross Using" labelWidth="w-44" className="flex items-center min-h-[26px]">
          <input
            className={inputCls}
            value={bankForm.cross_using || "A/c Payee"}
            onChange={setBankField("cross_using")}
          />
        </FormRow>
      )}
    </div>
  );
}
