// Static lists shown in the Excise Duty Classification Creation screen (issue #140).
// Duty codes come from TallyPrime's "List of Excise Duty Codes"; calculation
// methods from "List of Excise Duty Classifications".

export interface CodeOption {
  value: string;
  label: string;
}

// label = "<code> — <description>"; value = the code stored in the DB.
export const EXCISE_DUTY_CODES: CodeOption[] = [
  { value: "Not Applicable", label: "Not Applicable" },
  { value: "ADC_LVD_CL_75", label: "ADC_LVD_CL_75 — Additional Duty of Imports" },
  { value: "ADE", label: "ADE — Additional Duty Levied under Clause 85" },
  { value: "AED_GSI", label: "AED_GSI — Additional Excise Duty on GSI" },
  { value: "AED_TTA", label: "AED_TTA — Additional Excise Duty on TTA" },
  { value: "CENVAT", label: "CENVAT — Basic Excise Duty" },
  { value: "CESS_AUTOMBL", label: "CESS_AUTOMBL — Cess on automobiles" },
  { value: "CESS_BEEDI", label: "CESS_BEEDI — Cess on beedi" },
  { value: "CESS_CASHEW", label: "CESS_CASHEW — Cess on cashew" },
  { value: "CESS_CHROME", label: "CESS_CHROME — Cess on chrome" },
  { value: "CESS_COAL_COKE", label: "CESS_COAL_COKE — Cess on coke coal" },
  { value: "CESS_COFFEE", label: "CESS_COFFEE — Cess on coffee" },
  { value: "CESS_COPRA", label: "CESS_COPRA — Cess on copra" },
  { value: "CESS_COTN_FBRC", label: "CESS_COTN_FBRC — Cess on cotton fabrics" },
  { value: "CESS_COTTON", label: "CESS_COTTON — Cess on cotton" },
  { value: "CESS_CRUDEOIL", label: "CESS_CRUDEOIL — Cess on crude oil" },
  { value: "CESS_FIBER", label: "CESS_FIBER — Cess on fiber" },
  { value: "CESS_FILMS", label: "CESS_FILMS — Cess on feature films" },
  { value: "CESS_IRON_ORE", label: "CESS_IRON_ORE — Cess on iron ore" },
  { value: "CESS_JUTE", label: "CESS_JUTE — Cess on jute" },
  { value: "CESS_LAC", label: "CESS_LAC — Cess on lac" },
  { value: "CESS_LIME_DLMT", label: "CESS_LIME_DLMT — Cess on limestone and dolomite" },
  { value: "CESS_MAGNSE", label: "CESS_MAGNSE — Cess on manganese" },
  { value: "CESS_MARINE", label: "CESS_MARINE — Cess on marine" },
  { value: "CESS_MATCHES", label: "CESS_MATCHES — Cess on matches" },
  { value: "CESS_MEDICINAL", label: "CESS_MEDICINAL — Cess on medicinal" },
  { value: "CESS_MIXMD_FBRC", label: "CESS_MIXMD_FBRC — Cess on mixmade fabrics" },
  { value: "CESS_NATRL_GAS", label: "CESS_NATRL_GAS — Cess on natural gas" },
  { value: "CESS_OIL", label: "CESS_OIL — Cess on oil" },
  { value: "CESS_PAPER", label: "CESS_PAPER — Cess on paper" },
  { value: "CESS_RAYON", label: "CESS_RAYON — Cess on rayon" },
  { value: "CESS_RUBBER", label: "CESS_RUBBER — Cess on rubber" },
  { value: "CESS_SALT", label: "CESS_SALT — Cess on salt" },
  { value: "CESS_STRW_BRD", label: "CESS_STRW_BRD — Cess on straw board" },
  { value: "CESS_SUGAR", label: "CESS_SUGAR — Cess on sugar" },
  { value: "CESS_TEA", label: "CESS_TEA — Cess on tea" },
  { value: "CESS_TEXTILE", label: "CESS_TEXTILE — Cess on textile" },
  { value: "CESS_TOBACCO", label: "CESS_TOBACCO — Cess on tobacco" },
  { value: "CESS_VEG_OIL", label: "CESS_VEG_OIL — Cess on vegetable oil" },
  { value: "CESS_WOOLEN", label: "CESS_WOOLEN — Cess on woolen" },
  { value: "EDU_CESS", label: "EDU_CESS — Education Cess" },
  { value: "NCCD", label: "NCCD — National Calamity Contingent Duty" },
  { value: "SAED", label: "SAED — Special Additional Excise Duty" },
  { value: "SED_EDU_CESS", label: "SED_EDU_CESS — Secondary Education Cess" },
  { value: "SED", label: "SED — Special Excise Duty" },
];

export const EXCISE_CALCULATION_METHODS: CodeOption[] = [
  { value: "On Assessable Value", label: "On Assessable Value" },
  { value: "Basic Excise Duty", label: "Basic Excise Duty" },
];

export const dutyCodeLabel = (code?: string | null) =>
  EXCISE_DUTY_CODES.find((c) => c.value === code)?.label ?? code ?? "—";
