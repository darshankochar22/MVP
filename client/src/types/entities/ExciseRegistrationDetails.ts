// Excise Registration Details — singleton per-company config (Issue #145).
// Lives under Gateway → Statutory Details → Excise Registration Details.

export const EXCISE_REGISTRATION_TYPES = ["Dealer", "Importer", "Manufacturer"] as const;
export type ExciseRegistrationType = (typeof EXCISE_REGISTRATION_TYPES)[number];

export const EXCISE_VALUATION_TYPES = [
  "Ad Valorem",
  "Ad Quantum",
  "MRP Based",
  "Not Applicable",
] as const;
export type ExciseValuationType = (typeof EXCISE_VALUATION_TYPES)[number];

// One row of the optional "Define excise tariff and duty details as masters" list.
export interface ExciseTariffItem {
  tariffName: string;
  hsnCode: string;
  reportingUom: string;
  valuationType: ExciseValuationType;
  rate: number;
}

export interface ExciseRegistrationDetails {
  unitName: string;
  address: string;
  state: string;
  pincode: string;
  telephoneNo: string;
  registrationType: ExciseRegistrationType;
  eccNumber: string;
  setAlterExciseTariffDetails: number; // 0 / 1
  defineExciseTariffAsMasters: number; // 0 / 1 → reveals tariff list
  deactivateFrom: string; // yyyy-mm-dd
  tariffs: ExciseTariffItem[];
}

export const DEFAULT_EXCISE_TARIFF_ITEM: ExciseTariffItem = {
  tariffName: "",
  hsnCode: "",
  reportingUom: "",
  valuationType: "Ad Valorem",
  rate: 0,
};

export const DEFAULT_EXCISE_REGISTRATION_DETAILS: ExciseRegistrationDetails = {
  unitName: "",
  address: "",
  state: "",
  pincode: "",
  telephoneNo: "",
  registrationType: "Dealer",
  eccNumber: "",
  setAlterExciseTariffDetails: 0,
  defineExciseTariffAsMasters: 0,
  deactivateFrom: "",
  tariffs: [],
};
