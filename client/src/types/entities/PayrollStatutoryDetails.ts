// Payroll Statutory Details — singleton per-company config (Issue #142).
// Holds Provident Fund, Employee State Insurance, National Pension Scheme &
// Income Tax details used in Challan, Forms & Returns.

export const DEDUCTOR_TYPES = ["Government", "Others"] as const;
export type DeductorType = (typeof DEDUCTOR_TYPES)[number];

export interface PayrollStatutoryDetails {
  // Provident Fund
  pfCompanyCode: string;
  pfAccountGroupCode: string;
  pfSecurityCode: string;

  // Employee State Insurance
  esiCompanyCode: string;
  esiBranchOffice: string;
  esiStandardWorkingDays: number;

  // National Pension Scheme
  npsCorporateRegistrationNumber: string;
  npsCorporateBranchOfficeNumber: string;

  // Income Tax
  itTan: string;
  itTanRegistrationNumber: string;
  itCircleOrWard: string;
  itDeductorType: DeductorType;
  itDeductorBranchDivision: string;
  itPersonResponsibleName: string;
  itPersonResponsibleRelation: string;
  itDesignation: string;
  itPan: string;
}

export const DEFAULT_PAYROLL_STATUTORY_DETAILS: PayrollStatutoryDetails = {
  pfCompanyCode: "",
  pfAccountGroupCode: "",
  pfSecurityCode: "",
  esiCompanyCode: "",
  esiBranchOffice: "",
  esiStandardWorkingDays: 0,
  npsCorporateRegistrationNumber: "",
  npsCorporateBranchOfficeNumber: "",
  itTan: "",
  itTanRegistrationNumber: "",
  itCircleOrWard: "",
  itDeductorType: "Government",
  itDeductorBranchDivision: "",
  itPersonResponsibleName: "",
  itPersonResponsibleRelation: "",
  itDesignation: "",
  itPan: "",
};
