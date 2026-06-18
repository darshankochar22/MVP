import { FormRow } from "@/components/ui";
import type { InterestDetails } from "../hooks/useLedgerForm";
import { INTEREST_BALANCES, INTEREST_STYLES } from "./InterestParametersModal";

const selectCls =
  "bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

interface LedgerInterestPanelProps {
  activateInterest: number | undefined;
  handleActivateInterestChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  interestForm: InterestDetails;
  onEditInterest: () => void;
  showConfig: boolean;
}

export default function LedgerInterestPanel({
  activateInterest,
  handleActivateInterestChange,
  interestForm,
  onEditInterest,
  showConfig,
}: LedgerInterestPanelProps) {
  if (!showConfig) return null;

  const isActive = !!activateInterest;

  return (
    <div className="p-3 border-t border-zinc-100 bg-white">
      <div className="space-y-1">
        <FormRow
          label="Activate interest calculation"
          labelWidth="w-44"
          className="flex items-center min-h-[26px]"
        >
          <select
            className={selectCls}
            value={isActive ? "Yes" : "No"}
            onChange={handleActivateInterestChange}
          >
            <option>No</option>
            <option>Yes</option>
          </select>
        </FormRow>

        {isActive && (
          <div className="mt-2 pl-3 border-l-2 border-zinc-200 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
            {INTEREST_STYLES.includes(interestForm.interest_style) && (
              <FormRow
                label="Interest Style"
                labelWidth="w-36"
                className="flex items-center min-h-[22px] text-xs"
              >
                <span className="text-sm text-zinc-700 font-medium">
                  {interestForm.interest_style}
                </span>
              </FormRow>
            )}
            {INTEREST_BALANCES.includes(interestForm.interest_balances) && (
              <FormRow
                label="On Balances"
                labelWidth="w-36"
                className="flex items-center min-h-[22px] text-xs"
              >
                <span className="text-sm text-zinc-700 font-medium">
                  {interestForm.interest_balances}
                </span>
              </FormRow>
            )}
            {Number(interestForm.interest_rate) > 0 && (
              <FormRow
                label="Rate"
                labelWidth="w-36"
                className="flex items-center min-h-[22px] text-xs"
              >
                <span className="text-sm text-zinc-700 font-medium tabular-nums">
                  {Number(interestForm.interest_rate).toFixed(2)} %
                </span>
              </FormRow>
            )}
            {(interestForm.interest_include_added ||
              interestForm.interest_include_deducted) && (
              <FormRow
                label="Include Txn Date"
                labelWidth="w-36"
                className="flex items-center min-h-[22px] text-xs"
              >
                <span className="text-sm text-zinc-700">
                  {[
                    interestForm.interest_include_added ? "Added" : null,
                    interestForm.interest_include_deducted ? "Deducted" : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </FormRow>
            )}
            <button
              onClick={onEditInterest}
              className="text-xs text-zinc-500 hover:text-zinc-800 underline underline-offset-1 mt-1 block transition-colors font-medium"
            >
              Edit interest parameters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
