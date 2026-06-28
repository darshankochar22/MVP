import { FormRow } from "@/components/ui";
import {
  type ServiceTaxDetails,
  type ServiceTaxCategory,
  ORGANISATION_TYPES,
  COMPUTATION_BASIS,
  DEFAULT_SERVICE_TAX_CATEGORY,
} from "@/types/entities/ServiceTaxDetails";

// ─── Shared field tokens (black / white / zinc only) ───────────────────────────
const inputCls =
  "w-72 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const selectCls =
  "w-72 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const dateCls =
  "w-44 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

const LABEL_W = "w-80";

// Cess columns rendered in the "Define service category" grid.
const RATE_COLS: { key: keyof ServiceTaxCategory; label: string }[] = [
  { key: "serviceTaxRate", label: "Service tax" },
  { key: "educationCessRate", label: "Education cess" },
  { key: "secondaryEducationCessRate", label: "Sec. edu. cess" },
  { key: "swachhBharatCessRate", label: "Swachh Bharat" },
  { key: "krishiKalyanCessRate", label: "Krishi Kalyan" },
];

export function ServiceTaxDetailsForm({
  form,
  setField,
  firstFieldAutoFocus = false,
}: {
  form: ServiceTaxDetails;
  setField: <K extends keyof ServiceTaxDetails>(key: K, value: ServiceTaxDetails[K]) => void;
  firstFieldAutoFocus?: boolean;
}) {
  const YesNo = ({
    label,
    field,
  }: {
    label: string;
    field: keyof ServiceTaxDetails;
  }) => (
    <FormRow label={label} labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
      <select
        className={selectCls}
        value={Number(form[field]) ? "Yes" : "No"}
        onChange={(e) => setField(field, (e.target.value === "Yes" ? 1 : 0) as ServiceTaxDetails[typeof field])}
      >
        <option>No</option>
        <option>Yes</option>
      </select>
    </FormRow>
  );

  // ── service-category list helpers (always keep one blank row to type into) ──
  const rows: ServiceTaxCategory[] = [...form.categories, { ...DEFAULT_SERVICE_TAX_CATEGORY }];
  const commit = (next: ServiceTaxCategory[]) =>
    setField("categories", next.filter((r) => String(r.name || "").trim() !== ""));
  const updateRow = (idx: number, patch: Partial<ServiceTaxCategory>) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    commit(next);
  };
  const removeRow = (idx: number) => commit(rows.filter((_, i) => i !== idx));

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
      <div className="p-6 max-w-[920px]">
        <div className="text-center text-sm font-bold text-zinc-800 mb-4">
          Service Tax Details
        </div>

        <FormRow label="Service tax registration number" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <input
            autoFocus={firstFieldAutoFocus}
            className={inputCls}
            value={form.serviceTaxRegistrationNumber}
            onChange={(e) => setField("serviceTaxRegistrationNumber", e.target.value)}
          />
        </FormRow>

        <FormRow label="Type of organisation" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <select
            className={selectCls}
            value={form.typeOfOrganisation}
            onChange={(e) => setField("typeOfOrganisation", e.target.value as ServiceTaxDetails["typeOfOrganisation"])}
          >
            {ORGANISATION_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </FormRow>

        <YesNo label="Is Monthly format" field="isMonthlyFormat" />

        <FormRow label="Compute tax liability based on" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <select
            className={selectCls}
            value={form.computeTaxLiabilityBasedOn}
            onChange={(e) => setField("computeTaxLiabilityBasedOn", e.target.value as ServiceTaxDetails["computeTaxLiabilityBasedOn"])}
          >
            {COMPUTATION_BASIS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </FormRow>

        <YesNo label="Set/alter service tax details" field="setAlterServiceTaxDetails" />
        {Number(form.setAlterServiceTaxDetails) === 1 && (
          <FormRow label="Applicable from" labelWidth="w-80 pl-4" className="flex items-center min-h-[26px]">
            <input
              type="date"
              className={dateCls}
              value={form.taxLiabilityApplicableFrom}
              onChange={(e) => setField("taxLiabilityApplicableFrom", e.target.value)}
            />
          </FormRow>
        )}

        <YesNo label="Define service category and tax details as masters" field="defineServiceCategoryAsMasters" />

        <YesNo label="Is reverse charge applicable" field="isReverseChargeApplicable" />

        <FormRow label="Deactivate from" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <input
            type="date"
            className={dateCls}
            value={form.deactivateFrom}
            onChange={(e) => setField("deactivateFrom", e.target.value)}
          />
        </FormRow>

        {/* ── Service Category Details (Secondary) — rate breakup as masters ── */}
        {Number(form.defineServiceCategoryAsMasters) === 1 && (
          <div className="mt-6">
            <div className="text-[12px] font-bold text-zinc-700 uppercase tracking-wide mb-2">
              Service Category Details — Rate Details
            </div>
            <table className="border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-700">
                  <th className="text-left font-semibold px-2 py-1 w-64">Name</th>
                  {RATE_COLS.map((c) => (
                    <th key={c.key} className="text-right font-semibold px-2 py-1 w-28">{c.label} %</th>
                  ))}
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const isBlankLast = idx === rows.length - 1;
                  return (
                    <tr key={idx} className="border-b border-zinc-100">
                      <td className="px-2 py-0.5">
                        <input
                          className="w-60 bg-transparent text-sm outline-none px-1 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded"
                          placeholder={isBlankLast ? "Add category…" : ""}
                          value={row.name}
                          onChange={(e) => updateRow(idx, { name: e.target.value })}
                        />
                      </td>
                      {RATE_COLS.map((c) => (
                        <td key={c.key} className="px-2 py-0.5 text-right">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="w-24 text-right bg-transparent text-sm outline-none px-1 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded"
                            value={Number(row[c.key]) || ""}
                            onChange={(e) => updateRow(idx, { [c.key]: Number(e.target.value) || 0 })}
                          />
                        </td>
                      ))}
                      <td className="px-1 text-center">
                        {!isBlankLast && (
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="text-zinc-400 hover:text-zinc-900 font-bold leading-none"
                            title="Remove"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="text-[11px] italic text-zinc-400 mt-1">End of List</div>
          </div>
        )}

        <div className="mt-6 pt-3 border-t border-zinc-100 text-[11px] italic text-zinc-400">
          Note: Service tax registration &amp; computation details are used in service tax Challan, Forms &amp; Returns.
        </div>
      </div>
      <div className="flex-1" />
    </div>
  );
}
