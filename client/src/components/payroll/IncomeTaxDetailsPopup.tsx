import Modal from "@/components/ui/Modal";
import { FormRow } from "@/components/ui";

const selectCls = "flex-1 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-zinc-200 hover:border-zinc-400 focus:border-zinc-800 transition-colors bg-white rounded";

export const INCOME_TAX_COMPONENTS = [
  "Not Applicable",
  "Allowance to Transport Employee",
  "Basic Salary",
  "Bonus",
  "Children Education Allowance",
  "Children Hostel Expenditure Allowance",
  "Commission (Is Fixed Percentage of Turnover)",
  "Conveyance / Transport Allowance",
  "Dearness Allowance",
  "Dearness Allowance (Considered for Retirement Benefits)",
  "Employee Provident Fund (EPF)",
  "Encashment of Leave Salary",
  "Entertainment Allowance",
  "Field Area Allowance",
  "Gratuity",
  "High Altitude Allowance",
  "Hill Area Compensatory Allowance",
  "House Rent Allowance",
  "Leave Travel Allowance",
  "Leave Encashment on Retirement",
  "Leave Travel Assistance",
  "Medical Allowance",
  "Medical Reimbursement",
  "Mining/Underground Allowance",
  "Modified Field Area Allowance",
  "Other Earnings/Allowances (Fully Exempt)",
  "Other Earnings/Allowances (Fully Taxable)",
  "Other Earnings/Allowances (Partially Exempt)",
  "Professional Tax (Tax on Employment)",
  "Standard Deduction",
  "Transport Allowance",
  "Tribal Area Allowance",
  "Voluntary Retirement Compensation",
];

export interface IncomeTaxDetails {
  it_component: string;
  it_calculation_basis: string;
  it_deduct_tds_across_periods: string;
}

interface Props {
  open: boolean;
  value: IncomeTaxDetails;
  onChange: (next: IncomeTaxDetails) => void;
  onClose: () => void;
}

export default function IncomeTaxDetailsPopup({ open, value, onChange, onClose }: Props) {
  const set = (key: keyof IncomeTaxDetails) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...value, [key]: e.target.value });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Income Tax Details"
      width="w-[520px]"
      footer={
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs font-semibold bg-zinc-900 text-white border border-zinc-900 hover:bg-zinc-700"
        >
          Accept
        </button>
      }
    >
      <div className="space-y-2">
        <FormRow label="Income Tax Component" labelWidth="w-52" className="flex items-center min-h-[26px]">
          <select className={selectCls} value={value.it_component} onChange={set("it_component")}>
            {INCOME_TAX_COMPONENTS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormRow>
        <FormRow label="Tax Calculation Basis" labelWidth="w-52" className="flex items-center min-h-[26px]">
          <select className={selectCls} value={value.it_calculation_basis} onChange={set("it_calculation_basis")}>
            <option value="On Actual Value">On Actual Value</option>
            <option value="On Projected Value">On Projected Value</option>
          </select>
        </FormRow>
        <FormRow label="Deduct TDS Across Periods" labelWidth="w-52" className="flex items-center min-h-[26px]">
          <select className={selectCls} value={value.it_deduct_tds_across_periods} onChange={set("it_deduct_tds_across_periods")}>
            <option>No</option>
            <option>Yes</option>
          </select>
        </FormRow>
      </div>
    </Modal>
  );
}
