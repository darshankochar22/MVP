import { FormRow } from "@/components/ui";
import { INDIAN_STATES } from "@/constants/states";
import {
  type ExciseRegistrationDetails,
  type ExciseTariffItem,
  EXCISE_REGISTRATION_TYPES,
  EXCISE_VALUATION_TYPES,
  DEFAULT_EXCISE_TARIFF_ITEM,
} from "@/types/entities/ExciseRegistrationDetails";

// ─── Shared field tokens (black / white / zinc only) ───────────────────────────
const inputCls =
  "w-72 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const selectCls = inputCls;
const dateCls =
  "w-44 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

const LABEL_W = "w-80";

export function ExciseRegistrationDetailsForm({
  form,
  setField,
  firstFieldAutoFocus = false,
}: {
  form: ExciseRegistrationDetails;
  setField: <K extends keyof ExciseRegistrationDetails>(key: K, value: ExciseRegistrationDetails[K]) => void;
  firstFieldAutoFocus?: boolean;
}) {
  const Text = ({
    label,
    field,
    autoFocus = false,
    maxLength,
  }: {
    label: string;
    field: keyof ExciseRegistrationDetails;
    autoFocus?: boolean;
    maxLength?: number;
  }) => (
    <FormRow label={label} labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
      <input
        autoFocus={autoFocus}
        className={inputCls}
        maxLength={maxLength}
        value={String(form[field] ?? "")}
        onChange={(e) => setField(field, e.target.value as ExciseRegistrationDetails[typeof field])}
      />
    </FormRow>
  );

  const YesNo = ({ label, field }: { label: string; field: keyof ExciseRegistrationDetails }) => (
    <FormRow label={label} labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
      <select
        className={selectCls}
        value={Number(form[field]) ? "Yes" : "No"}
        onChange={(e) => setField(field, (e.target.value === "Yes" ? 1 : 0) as ExciseRegistrationDetails[typeof field])}
      >
        <option>No</option>
        <option>Yes</option>
      </select>
    </FormRow>
  );

  // ── tariff list helpers (keep one blank row to type into) ──
  const rows: ExciseTariffItem[] = [...form.tariffs, { ...DEFAULT_EXCISE_TARIFF_ITEM }];
  const commit = (next: ExciseTariffItem[]) =>
    setField("tariffs", next.filter((r) => String(r.tariffName || "").trim() !== ""));
  const updateRow = (idx: number, patch: Partial<ExciseTariffItem>) =>
    commit(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeRow = (idx: number) => commit(rows.filter((_, i) => i !== idx));

  const cellInput =
    "w-full bg-transparent text-sm outline-none px-1 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded";

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
      <div className="p-6 max-w-[960px]">
        <div className="text-center text-sm font-bold text-zinc-800 mb-4">Excise Details</div>

        <Text label="Unit name" field="unitName" autoFocus={firstFieldAutoFocus} />
        <Text label="Address" field="address" />

        <FormRow label="State" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <select
            className={selectCls}
            value={form.state}
            onChange={(e) => setField("state", e.target.value)}
          >
            <option value="">Not Applicable</option>
            {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </FormRow>

        <Text label="Pincode" field="pincode" maxLength={6} />
        <Text label="Telephone No." field="telephoneNo" />

        <FormRow label="Registration type" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <select
            className={selectCls}
            value={form.registrationType}
            onChange={(e) => setField("registrationType", e.target.value as ExciseRegistrationDetails["registrationType"])}
          >
            {EXCISE_REGISTRATION_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </FormRow>

        <Text label="ECC number" field="eccNumber" />

        <YesNo label="Set/alter excise tariff details" field="setAlterExciseTariffDetails" />
        <YesNo label="Define excise tariff and duty details as masters" field="defineExciseTariffAsMasters" />

        <FormRow label="Deactivate from" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <input
            type="date"
            className={dateCls}
            value={form.deactivateFrom}
            onChange={(e) => setField("deactivateFrom", e.target.value)}
          />
        </FormRow>

        {/* ── Excise Tariff Details — tariff/duty masters ── */}
        {Number(form.defineExciseTariffAsMasters) === 1 && (
          <div className="mt-6">
            <div className="text-[12px] font-bold text-zinc-700 uppercase tracking-wide mb-2">
              Excise Tariff Details
            </div>
            <table className="border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-700">
                  <th className="text-left font-semibold px-2 py-1 w-52">Tariff name</th>
                  <th className="text-left font-semibold px-2 py-1 w-32">HSN code</th>
                  <th className="text-left font-semibold px-2 py-1 w-40">Reporting UOM</th>
                  <th className="text-left font-semibold px-2 py-1 w-40">Valuation type</th>
                  <th className="text-right font-semibold px-2 py-1 w-24">Rate %</th>
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
                          className={cellInput}
                          placeholder={isBlankLast ? "Add tariff…" : ""}
                          value={row.tariffName}
                          onChange={(e) => updateRow(idx, { tariffName: e.target.value })}
                        />
                      </td>
                      <td className="px-2 py-0.5">
                        <input className={cellInput} value={row.hsnCode} onChange={(e) => updateRow(idx, { hsnCode: e.target.value })} />
                      </td>
                      <td className="px-2 py-0.5">
                        <input className={cellInput} value={row.reportingUom} onChange={(e) => updateRow(idx, { reportingUom: e.target.value })} />
                      </td>
                      <td className="px-2 py-0.5">
                        <select
                          className={cellInput}
                          value={row.valuationType}
                          onChange={(e) => updateRow(idx, { valuationType: e.target.value as ExciseTariffItem["valuationType"] })}
                        >
                          {EXCISE_VALUATION_TYPES.map((v) => <option key={v}>{v}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-0.5 text-right">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className={`${cellInput} text-right`}
                          value={Number(row.rate) || ""}
                          onChange={(e) => updateRow(idx, { rate: Number(e.target.value) || 0 })}
                        />
                      </td>
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
          Note: Excise registration &amp; tariff details are used in excise invoices, returns &amp; reports.
        </div>
      </div>
      <div className="flex-1" />
    </div>
  );
}
