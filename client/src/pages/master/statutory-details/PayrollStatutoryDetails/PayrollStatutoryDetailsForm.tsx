import { FormRow } from "@/components/ui";
import {
  type PayrollStatutoryDetails,
  DEDUCTOR_TYPES,
} from "@/types/entities/PayrollStatutoryDetails";

// ─── Shared field tokens (black / white / zinc only) ───────────────────────────
const inputCls =
  "w-72 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const selectCls =
  "w-72 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

const LABEL_W = "w-72";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-bold text-zinc-700 uppercase tracking-wide mt-4 mb-1.5">
      {children}
    </div>
  );
}

// Field row defined at MODULE scope (not inside the form component) so its
// component identity is stable across renders. When it was declared inline,
// every keystroke gave React a brand-new component type → it remounted the
// input, dropping focus, and the first field's autoFocus yanked the cursor
// back to "Company code" on each change.
function TextField({
  label,
  field,
  form,
  setField,
  autoFocus = false,
  indent = false,
  maxLength,
}: {
  label: string;
  field: keyof PayrollStatutoryDetails;
  form: PayrollStatutoryDetails;
  setField: <K extends keyof PayrollStatutoryDetails>(key: K, value: PayrollStatutoryDetails[K]) => void;
  autoFocus?: boolean;
  indent?: boolean;
  maxLength?: number;
}) {
  return (
    <FormRow
      label={label}
      labelWidth={indent ? "w-72 pl-4" : LABEL_W}
      className="flex items-center min-h-[26px]"
    >
      <input
        autoFocus={autoFocus}
        className={inputCls}
        value={String(form[field] ?? "")}
        maxLength={maxLength}
        onChange={(e) => setField(field, e.target.value as PayrollStatutoryDetails[typeof field])}
      />
    </FormRow>
  );
}

export function PayrollStatutoryDetailsForm({
  form,
  setField,
  firstFieldAutoFocus = false,
}: {
  form: PayrollStatutoryDetails;
  setField: <K extends keyof PayrollStatutoryDetails>(key: K, value: PayrollStatutoryDetails[K]) => void;
  firstFieldAutoFocus?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
      <div className="p-6 max-w-[760px]">
        <div className="text-center text-sm font-bold text-zinc-800 mb-2">
          Payroll Statutory Details
        </div>

        {/* ── Provident Fund ── */}
        <SectionTitle>Provident Fund</SectionTitle>
        <TextField label="Company code" field="pfCompanyCode" form={form} setField={setField} autoFocus={firstFieldAutoFocus} />
        <TextField label="Company account group code" field="pfAccountGroupCode" form={form} setField={setField} />
        <TextField label="Company security code" field="pfSecurityCode" form={form} setField={setField} />

        {/* ── Employee State Insurance ── */}
        <SectionTitle>Employee State Insurance</SectionTitle>
        <TextField label="Company code" field="esiCompanyCode" form={form} setField={setField} />
        <TextField label="ESI branch office" field="esiBranchOffice" form={form} setField={setField} />
        <FormRow label="Standard working days per month" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.esiStandardWorkingDays || ""}
            onChange={(e) => setField("esiStandardWorkingDays", Number(e.target.value) || 0)}
          />
        </FormRow>

        {/* ── National Pension Scheme ── */}
        <SectionTitle>National Pension Scheme</SectionTitle>
        <TextField label="Corporate registration number" field="npsCorporateRegistrationNumber" form={form} setField={setField} />
        <TextField label="Corporate branch office number" field="npsCorporateBranchOfficeNumber" form={form} setField={setField} />

        {/* ── Income Tax ── */}
        <SectionTitle>Income Tax</SectionTitle>
        <TextField label="Tax deduction and collection Account Number (TAN)" field="itTan" form={form} setField={setField} maxLength={10} />
        <TextField label="TAN registration number" field="itTanRegistrationNumber" form={form} setField={setField} />
        <TextField label="Income tax circle or ward" field="itCircleOrWard" form={form} setField={setField} />
        <FormRow label="Deductor type" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <select
            className={selectCls}
            value={form.itDeductorType}
            onChange={(e) => setField("itDeductorType", e.target.value as PayrollStatutoryDetails["itDeductorType"])}
          >
            {DEDUCTOR_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </FormRow>
        <TextField label="Deductor branch/division" field="itDeductorBranchDivision" form={form} setField={setField} />
        <TextField label="Name of person responsible" field="itPersonResponsibleName" form={form} setField={setField} />
        <TextField label="Son/daughter of" field="itPersonResponsibleRelation" form={form} setField={setField} indent />
        <TextField label="Designation" field="itDesignation" form={form} setField={setField} />
        <TextField label="PAN" field="itPan" form={form} setField={setField} maxLength={10} />

        <div className="mt-5 pt-3 border-t border-zinc-100 text-[11px] italic text-zinc-400">
          Note: All the above details will be used in Challan, Forms &amp; Returns.
        </div>
      </div>
      <div className="flex-1" />
    </div>
  );
}
