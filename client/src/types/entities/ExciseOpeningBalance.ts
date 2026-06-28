// Excise Opening Balance — singleton per-company voucher-style master (Issue #151).
// Lives under Gateway → Statutory Details → Excise Opening Balance.

// Read-only status tag shown on the voucher header.
export const EXCISE_OPENING_BALANCE_STATUS = "Excise Opening Balance";
export const DEFAULT_TAX_UNIT = "Default Tax Unit";

// CENVAT "Excise Adjustments" — selectable Particulars for an opening line.
export const EXCISE_ADJUSTMENTS = [
  "CENVAT on Inputs",
  "CENVAT on Capital Goods",
  "CENVAT on Input Services",
  "Basic Excise Duty",
  "Education Cess",
  "Secondary Education Cess",
] as const;
export type ExciseAdjustment = (typeof EXCISE_ADJUSTMENTS)[number];

// One opening-balance entry row: Particulars + Amount.
export interface ExciseOpeningBalanceLine {
  particulars: string;
  amount: number;
}

export interface ExciseOpeningBalance {
  voucherNo: string;
  voucherDate: string; // yyyy-mm-dd
  gstRegistration: string;
  taxUnit: string;
  status: string; // read-only, "Excise Opening Balance"
  narration: string;
  lines: ExciseOpeningBalanceLine[];
}

export const DEFAULT_EXCISE_OPENING_BALANCE_LINE: ExciseOpeningBalanceLine = {
  particulars: "",
  amount: 0,
};

export const DEFAULT_EXCISE_OPENING_BALANCE: ExciseOpeningBalance = {
  voucherNo: "",
  voucherDate: "",
  gstRegistration: "",
  taxUnit: DEFAULT_TAX_UNIT,
  status: EXCISE_OPENING_BALANCE_STATUS,
  narration: "",
  lines: [],
};
