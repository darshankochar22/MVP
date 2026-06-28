// Shared TallyPrime Pay Head field config (issue #153).

export const PAY_HEAD_TYPES = [
  "Not Applicable",
  "Bonus",
  "Deductions From Employees",
  "Earnings for Employees",
  "Employees' Statutory Deductions",
  "Employer's Other Charges",
  "Employer's Statutory Contributions",
  "Gratuity",
  "Loans and Advances",
  "Reimbursements to Employees",
  "Tax paid by Employer on Perquisites",
];

export const INCOME_TYPES = ["Fixed", "Variable"];

export const CALCULATION_TYPES = [
  "As Computed Value",
  "As User Defined Value",
  "As Per Income Tax Slab",
  "Flat Rate",
  "On Attendance",
  "On Production",
];

// Statutory pay-type lists per pay head type (sections E / F / G).
export const STATUTORY_PAY_TYPES: Record<string, string[]> = {
  "Employees' Statutory Deductions": [
    "Employee State Insurance",
    "Income Tax",
    "National Pension Scheme (Tier - I)",
    "National Pension Scheme (Tier - II)",
    "PF Account (A/c No. 1)",
    "Professional Tax",
    "Voluntary PF (A/c No. 1)",
  ],
  "Employer's Other Charges": [
    "Admin Charges (A/c No. 2)",
    "EDLI Admin Charges (A/c No. 22)",
    "EDLI Contribution (A/c No. 21)",
  ],
  "Employer's Statutory Contributions": [
    "Employee State Insurance",
    "EPS Account (A/c No. 10)",
    "National Pension Scheme (Tier - I)",
    "PF Account (A/c No. 1)",
  ],
};

export const showsStatutoryPayType = (t: string) =>
  t === "Employees' Statutory Deductions" ||
  t === "Employer's Other Charges" ||
  t === "Employer's Statutory Contributions";

export const showsIncomeType = (t: string) =>
  t === "Earnings for Employees" || t === "Reimbursements to Employees";

export const showsGratuityAndIT = (t: string) =>
  t === "Earnings for Employees" || t === "Bonus" || t === "Reimbursements to Employees";

// Computed types hide the Opening Balance field.
export const isComputedType = (calc: string) =>
  calc === "As Computed Value" || calc === "As Per Income Tax Slab";
