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

  const bsrNotApplicable = !bankForm.bsr_code;

  return (
    <div className="border-t border-zinc-100 bg-white">
      {/* Bank Account Details */}
      <div className="px-3 pt-3 pb-1 space-y-1.5">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Bank Account Details</div>
        <FormRow label="A/c Holder's Name" labelWidth="w-52" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={bankForm.account_holder_name || ""} onChange={setBankField("account_holder_name")} />
        </FormRow>
        <FormRow label="A/c No." labelWidth="w-52" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={bankForm.account_number || ""} onChange={setBankField("account_number")} />
        </FormRow>
        <FormRow label="IFS Code" labelWidth="w-52" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={bankForm.ifsc_code || ""} onChange={setBankField("ifsc_code")} />
        </FormRow>
        <FormRow label="SWIFT Code" labelWidth="w-52" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={bankForm.swift_code || ""} onChange={setBankField("swift_code")} />
        </FormRow>
        <FormRow label="Bank Name" labelWidth="w-52" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={bankForm.bank_name || ""} onChange={setBankField("bank_name")} />
        </FormRow>
        <FormRow label="Branch" labelWidth="w-52" className="flex items-center min-h-[26px]">
          <input className={inputCls} value={bankForm.branch || ""} onChange={setBankField("branch")} />
        </FormRow>
        <FormRow label="BSR Code" labelWidth="w-52" className="flex items-center min-h-[26px]">
          {bsrNotApplicable ? (
            <span className="text-sm text-zinc-400 px-1.5 cursor-pointer" onClick={() => {
              const synth = { target: { value: " " } } as React.ChangeEvent<HTMLInputElement>;
              setBankField("bsr_code")(synth);
            }}>+ Not Applicable</span>
          ) : (
            <input className={inputCls} value={bankForm.bsr_code || ""} onChange={setBankField("bsr_code")} />
          )}
        </FormRow>
      </div>

      {/* Bank Configuration */}
      <div className="px-3 pt-2 pb-3 space-y-1.5 border-t border-zinc-100 mt-1">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Bank Configuration</div>
        <FormRow label="Set/Alter range for Cheque Books" labelWidth="w-52" className="flex items-center min-h-[26px]">
          <select
            className={selectCls}
            value={bankForm.set_alter_cheque_books || "No"}
            onChange={setBankField("set_alter_cheque_books")}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </FormRow>
        <FormRow label="Enable Cheque Printing" labelWidth="w-52" className="flex items-center min-h-[26px]">
          <select
            className={selectCls}
            value={bankForm.enable_cheque_printing || "No"}
            onChange={setBankField("enable_cheque_printing")}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </FormRow>
        {bankForm.enable_cheque_printing === "Yes" && (
          <FormRow label="Set/Alter Cheque Printing configuration" labelWidth="w-52" className="flex items-center min-h-[26px]">
            <select
              className={selectCls}
              value={bankForm.set_alter_cheque_printing || "No"}
              onChange={setBankField("set_alter_cheque_printing")}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </FormRow>
        )}
      </div>
    </div>
  );
}
