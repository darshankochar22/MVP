import CreditLimitsScreen from "./CreditLimitsCreate";

// Credit Limits is a bulk "Multi Ledger Limit Alteration" over existing ledgers,
// so Alter reuses the exact same screen — only the back/return target differs.
export default function CreditLimitsAlter() {
  return <CreditLimitsScreen returnPath="/master/alter" />;
}
