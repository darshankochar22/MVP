// CENVAT Opening Balance — voucher-shaped singleton per-company master (Issue #147).
// Lives under Gateway → Statutory Details → CENVAT Opening Balance.

// "Excise Adjustments" popup options for the `CENVAT credit of` field.
export const CENVAT_CREDIT_OF = ["Both", "Capital Goods", "Inputs"] as const;
export type CenvatCreditOf = (typeof CENVAT_CREDIT_OF)[number];

// One Particulars/Amount row of the voucher grid.
export interface CenvatOpeningBalanceLine {
  particulars: string;
  amount: number;
}

export interface CenvatOpeningBalance {
  voucherNo: number; // auto / display-only
  voucherDate: string; // yyyy-mm-dd
  cenvatCreditOf: CenvatCreditOf;
  taxUnit: string;
  gstRegistration: string;
  narration: string;
  lines: CenvatOpeningBalanceLine[];
}

export const DEFAULT_CENVAT_LINE: CenvatOpeningBalanceLine = {
  particulars: "",
  amount: 0,
};

export const DEFAULT_CENVAT_OPENING_BALANCE: CenvatOpeningBalance = {
  voucherNo: 1,
  voucherDate: "",
  cenvatCreditOf: "Inputs",
  taxUnit: "Not Applicable",
  gstRegistration: "",
  narration: "",
  lines: [],
};
