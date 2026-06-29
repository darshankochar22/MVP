import VATRDCreate from "./VATRDCreate";

// VAT Registration Details is a per-company singleton — the hook loads the
// existing record and upserts, so Alter reuses the same screen; only the
// back/return target differs.
export default function VATRDAlter() {
  return <VATRDCreate returnPath="/master/alter" />;
}