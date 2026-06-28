import { FormRow } from "@/components/ui";
import { INDIAN_STATES } from "@/constants/states";
import {
  type ExciseRegistrationDetails,
  type ExciseTariffItem,
  EXCISE_REGISTRATION_TYPES,
  EXCISE_MANUFACTURER_TYPES,
  EXCISE_VALUATION_TYPES,
  DEFAULT_EXCISE_TARIFF_ITEM,
} from "@/types/entities/ExciseRegistrationDetails";
import { EXCISE_REPORTING_UOMS } from "@/pages/master/statutory/Tax-units/taxUnitsConstants";

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

  // ── single excise tariff detail, persisted as the first (only) tariff row ──
  const tariff: ExciseTariffItem =
    form.tariffs[0] ?? { ...DEFAULT_EXCISE_TARIFF_ITEM, reportingUom: "Undefined" };
  const updTariff = (patch: Partial<ExciseTariffItem>) =>
    setField("tariffs", [{ ...tariff, ...patch }]);

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

        {/* Type of manufacturer — only for Manufacturer registration (Issue #145) */}
        {form.registrationType === "Manufacturer" && (
          <FormRow label="Type of manufacturer" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
            <select
              className={selectCls}
              value={form.typeOfManufacturer}
              onChange={(e) => setField("typeOfManufacturer", e.target.value as ExciseRegistrationDetails["typeOfManufacturer"])}
            >
              {EXCISE_MANUFACTURER_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </FormRow>
        )}

        <Text label="ECC number" field="eccNumber" />

        <YesNo label="Set/alter excise tariff details" field="setAlterExciseTariffDetails" />

        {/* ── Excise Tariff Details — single tariff, shown when Set/alter = Yes ── */}
        {Number(form.setAlterExciseTariffDetails) === 1 && (
          <>
            <div className="text-[12px] font-bold text-zinc-700 mt-1 mb-0.5 pl-4">Excise Tariff Details</div>
            <FormRow label="Tariff name" labelWidth="w-80 pl-4" className="flex items-center min-h-[26px]">
              <input
                className={inputCls}
                value={tariff.tariffName}
                onChange={(e) => updTariff({ tariffName: e.target.value })}
              />
            </FormRow>
            <FormRow label="HSN code" labelWidth="w-80 pl-4" className="flex items-center min-h-[26px]">
              <input
                className={inputCls}
                value={tariff.hsnCode}
                onChange={(e) => updTariff({ hsnCode: e.target.value })}
              />
            </FormRow>
            <FormRow label="Reporting unit of measure" labelWidth="w-80 pl-4" className="flex items-center min-h-[26px]">
              <select
                className={selectCls}
                value={tariff.reportingUom || "Undefined"}
                onChange={(e) => updTariff({ reportingUom: e.target.value })}
              >
                {EXCISE_REPORTING_UOMS.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.code === "Undefined" ? "Undefined" : `${u.code} — ${u.label}`}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Valuation type" labelWidth="w-80 pl-4" className="flex items-center min-h-[26px]">
              <select
                className={selectCls}
                value={tariff.valuationType}
                onChange={(e) => updTariff({ valuationType: e.target.value as ExciseTariffItem["valuationType"] })}
              >
                {EXCISE_VALUATION_TYPES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </FormRow>
            <FormRow label="Rate" labelWidth="w-80 pl-4" className="flex items-center min-h-[26px]">
              <input
                type="number"
                min={0}
                step="0.01"
                className={dateCls}
                value={Number(tariff.rate) || ""}
                onChange={(e) => updTariff({ rate: Number(e.target.value) || 0 })}
              />
              <span className="ml-1 text-sm text-zinc-500">%</span>
            </FormRow>
          </>
        )}

        <YesNo label="Define excise tariff and duty details as masters" field="defineExciseTariffAsMasters" />

        <FormRow label="Deactivate from" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <input
            type="date"
            className={dateCls}
            value={form.deactivateFrom}
            onChange={(e) => setField("deactivateFrom", e.target.value)}
          />
        </FormRow>

        <div className="mt-6 pt-3 border-t border-zinc-100 text-[11px] italic text-zinc-400">
          Note: Excise registration &amp; tariff details are used in excise invoices, returns &amp; reports.
        </div>
      </div>
      <div className="flex-1" />
    </div>
  );
}
