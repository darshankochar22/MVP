// PLA Opening Balance — singleton per-company voucher-style entry (Issue #148).
// Lives under Gateway → Statutory Details → PLA Opening Balance.

export const PLA_STATUS = "PLA Opening Balance";

// One ledger entry line of the voucher body.
export interface PlaOpeningBalanceLine {
  particulars: string; // ledger name
  amount: number;
}

export interface PlaOpeningBalance {
  voucherNo: string;
  voucherDate: string; // yyyy-mm-dd
  gstRegistration: string;
  taxUnit: string; // default "Not Applicable"
  status: string; // always "PLA Opening Balance"
  narration: string;
  lines: PlaOpeningBalanceLine[];
}

export const DEFAULT_PLA_LINE: PlaOpeningBalanceLine = {
  particulars: "",
  amount: 0,
};

export const DEFAULT_PLA_OPENING_BALANCE: PlaOpeningBalance = {
  voucherNo: "",
  voucherDate: "",
  gstRegistration: "",
  taxUnit: "Not Applicable",
  status: PLA_STATUS,
  narration: "",
  lines: [],
};
