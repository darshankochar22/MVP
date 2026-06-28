// Service Tax Details — singleton per-company config (Issue #146).
// Lives under Gateway → Statutory Details → Service Tax Details.

export const ORGANISATION_TYPES = [
  "Individual/Proprietory/One Person Company",
  "Registered Private Ltd Company",
  "Registered Public Ltd Company",
] as const;
export type OrganisationType = (typeof ORGANISATION_TYPES)[number];

export const COMPUTATION_BASIS = ["Accrual", "Realisation"] as const;
export type ComputationBasis = (typeof COMPUTATION_BASIS)[number];

// One row of the optional "Define service category and tax details as masters" list.
export interface ServiceTaxCategory {
  name: string;
  serviceTaxRate: number;
  educationCessRate: number;
  secondaryEducationCessRate: number;
  swachhBharatCessRate: number;
  krishiKalyanCessRate: number;
}

export interface ServiceTaxDetails {
  serviceTaxRegistrationNumber: string;
  typeOfOrganisation: OrganisationType;
  isMonthlyFormat: number; // 0 / 1
  computeTaxLiabilityBasedOn: ComputationBasis;
  setAlterServiceTaxDetails: number; // 0 / 1 → reveals "Applicable from"
  taxLiabilityApplicableFrom: string; // yyyy-mm-dd
  defineServiceCategoryAsMasters: number; // 0 / 1 → reveals category list
  isReverseChargeApplicable: number; // 0 / 1
  deactivateFrom: string; // yyyy-mm-dd
  categories: ServiceTaxCategory[];
}

export const DEFAULT_SERVICE_TAX_CATEGORY: ServiceTaxCategory = {
  name: "",
  serviceTaxRate: 0,
  educationCessRate: 0,
  secondaryEducationCessRate: 0,
  swachhBharatCessRate: 0,
  krishiKalyanCessRate: 0,
};

export const DEFAULT_SERVICE_TAX_DETAILS: ServiceTaxDetails = {
  serviceTaxRegistrationNumber: "",
  typeOfOrganisation: "Individual/Proprietory/One Person Company",
  isMonthlyFormat: 0,
  computeTaxLiabilityBasedOn: "Accrual",
  setAlterServiceTaxDetails: 0,
  taxLiabilityApplicableFrom: "",
  defineServiceCategoryAsMasters: 0,
  isReverseChargeApplicable: 0,
  deactivateFrom: "",
  categories: [],
};
