// Tax Units (Issue #42) — shared option lists for the Excise Details flow.

export const REGISTRATION_TYPES = ["Dealer", "Importer", "Manufacturer"] as const;

// "Types of Manufacturer" picker (Manufacturer unit only).
export const MANUFACTURER_TYPES = ["Regular", "Small Scale Industries(SSI)"] as const;

// "List of Valuation Types" in Excise Tariff Details.
export const VALUATION_TYPES = ["Undefined", "Ad Valorem", "Ad Quantum", "Valorem + Quantum"] as const;
export type ValuationType = (typeof VALUATION_TYPES)[number];

// Which rate inputs a valuation type exposes.
export const showsRatePercent = (v: string) => v === "Ad Valorem" || v === "Undefined" || v === "Valorem + Quantum";
export const showsRatePerUnit = (v: string) => v === "Ad Quantum" || v === "Undefined" || v === "Valorem + Quantum";

// "List of Excise Reporting UoMs" (code + description), per the issue screenshots.
export const EXCISE_REPORTING_UOMS: { code: string; label: string }[] = [
  { code: "Undefined", label: "Undefined" },
  { code: "10GMS", label: "10 Grams" },
  { code: "1KKWH", label: "1000 Kilowatt Hours" },
  { code: "C/K", label: "Carats" },
  { code: "CM", label: "Centimetre" },
  { code: "CM3", label: "Cubic Centimetre" },
  { code: "G", label: "Grams" },
  { code: "G:F/S", label: "Gram of Fissile Isotopes" },
  { code: "KG", label: "Kilograms" },
  { code: "KL", label: "Kilolitre" },
  { code: "L", label: "Litre" },
  { code: "M", label: "Metre" },
  { code: "M2", label: "Square Metre" },
  { code: "M3", label: "Cubic Metre" },
  { code: "MM", label: "Millimetre" },
  { code: "MT", label: "Metric Tonne" },
  { code: "PA", label: "Number of Pairs" },
  { code: "Q", label: "Quintal" },
  { code: "T", label: "Ton" },
  { code: "TU", label: "Thousand in Nos" },
  { code: "U", label: "Numbers" },
];
