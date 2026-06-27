import { useEffect, useState } from "react";
import { EMPTY_CHEQUE_PRINTING_CONFIG, type ChequePrintingConfig } from "./BankDetailsPopup";

interface ChequePrintingConfigPopupProps {
  ledgerName: string;
  config?: ChequePrintingConfig;
  onClose: () => void;
  onAccept: (config: ChequePrintingConfig) => void;
}

const fieldCls =
  "w-24 bg-transparent text-sm text-zinc-900 text-right outline-none px-1.5 py-0.5 border-b border-zinc-300 focus:border-zinc-800 transition-colors";
const textCls =
  "flex-1 bg-transparent text-sm text-zinc-900 outline-none px-1.5 py-0.5 border-b border-zinc-300 focus:border-zinc-800 transition-colors";
const selectCls =
  "bg-transparent text-sm text-zinc-900 outline-none px-1 py-0.5 border-b border-zinc-300 focus:border-zinc-800 transition-colors";

export default function ChequePrintingConfigPopup({
  ledgerName,
  config,
  onClose,
  onAccept,
}: ChequePrintingConfigPopupProps) {
  const [form, setForm] = useState<ChequePrintingConfig>({
    ...EMPTY_CHEQUE_PRINTING_CONFIG,
    ...config,
  });

  const commit = () => onAccept(form);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        commit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [form]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof ChequePrintingConfig, numeric = false) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const v = numeric ? e.target.value.replace(/[^0-9.]/g, "") : e.target.value;
      setForm((f) => ({ ...f, [key]: v }));
    };

  // Distance of 1st Line from Top Edge = A - B
  const aMinusB = (() => {
    const a = Number(form.words_a_dist_2nd_top);
    const b = Number(form.words_b_gap);
    if (!form.words_a_dist_2nd_top || !form.words_b_gap || Number.isNaN(a) || Number.isNaN(b)) return "";
    return String(a - b);
  })();

  // Row helpers ──────────────────────────────────────────────────────────────
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="text-sm font-bold text-zinc-900 mt-3 mb-1">{children}</div>
  );

  const NumRow = ({ label, k, indent }: { label: string; k: keyof ChequePrintingConfig; indent?: boolean }) => (
    <div className="flex items-center min-h-[28px]">
      <span className={`flex-1 text-sm text-zinc-700 ${indent ? "pl-4" : ""}`}>{label}</span>
      <span className="text-zinc-400 mr-2">:</span>
      <input className={fieldCls} inputMode="decimal" value={form[k]} onChange={set(k, true)} />
    </div>
  );

  const TextRow = ({ label, k }: { label: string; k: keyof ChequePrintingConfig }) => (
    <div className="flex items-center min-h-[28px]">
      <span className="flex-1 text-sm text-zinc-700">{label}</span>
      <span className="text-zinc-400 mr-2">:</span>
      <input className={textCls} value={form[k]} onChange={set(k)} />
    </div>
  );

  const YesNoRow = ({ label, k }: { label: string; k: keyof ChequePrintingConfig }) => (
    <div className="flex items-center min-h-[28px]">
      <span className="flex-1 text-sm text-zinc-700">{label}</span>
      <span className="text-zinc-400 mr-2">:</span>
      <select className={selectCls} value={form[k]} onChange={set(k)}>
        <option value="Yes">Yes</option>
        <option value="No">No</option>
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/10 pt-12" onClick={onClose}>
      <div
        className="bg-white border border-zinc-400 shadow-lg flex flex-col"
        style={{ width: 1040, maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="text-center py-2 border-b border-zinc-200 select-none">
          <div className="text-sm">
            <span className="font-bold text-zinc-900">Cheque Printing Configuration for : </span>
            <span className="font-bold text-zinc-900">{ledgerName || "—"}</span>
          </div>
          <div className="text-xs italic text-zinc-500">(All Dimensions in mm only)</div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-3">
          <div className="grid grid-cols-2 gap-x-16">
            {/* LEFT COLUMN */}
            <div>
              <SectionTitle>Cheque Dimension</SectionTitle>
              <NumRow label="Width of Cheque" k="width_of_cheque" />
              <NumRow label="Height of Cheque" k="height_of_cheque" />

              <SectionTitle>Cross Cheque</SectionTitle>
              <NumRow label="Starting Location from Left Edge" k="cross_start_left" />
              <NumRow label="Starting Location from Top Edge" k="cross_start_top" />

              <SectionTitle>Cheque Date</SectionTitle>
              <NumRow label="Distance of Line from Top Edge" k="date_distance_top" />
              <NumRow label="Starting Location from Left Edge" k="date_start_left" />
              <div className="flex items-center min-h-[28px]">
                <span className="flex-1 text-sm text-zinc-700">Style of Date</span>
                <span className="text-zinc-400 mr-2">:</span>
                <select className={selectCls} value={form.style_of_date} onChange={set("style_of_date")}>
                  <option value="dd-mmm-yyyy">dd-mmm-yyyy</option>
                  <option value="dd-mm-yyyy">dd-mm-yyyy</option>
                  <option value="dd/mm/yyyy">dd/mm/yyyy</option>
                  <option value="dd.mm.yyyy">dd.mm.yyyy</option>
                  <option value="mmm-dd-yyyy">mmm-dd-yyyy</option>
                </select>
              </div>
              <TextRow label="Separator used in date" k="date_separator" />
              <NumRow label="Separator width" k="date_separator_width" indent />
              <NumRow label="Distance between Characters" k="date_char_distance" indent />

              <SectionTitle>Party's / Payee Name</SectionTitle>
              <NumRow label="Distance of Line from Top Edge" k="payee_distance_top" />
              <NumRow label="Starting Location from Left Edge" k="payee_start_left" />
              <NumRow label="Width area" k="payee_width" />
            </div>

            {/* RIGHT COLUMN */}
            <div>
              <SectionTitle>Amount in Words</SectionTitle>
              <NumRow label="(A) Distance of 2nd Line from Top Edge" k="words_a_dist_2nd_top" />
              <NumRow label="(B) Height (gap) between 2nd and 1st Line" k="words_b_gap" />
              <div className="flex items-center min-h-[28px]">
                <span className="flex-1 text-sm italic text-zinc-600">
                  Distance of 1st Line from Top Edge ( A - B )
                </span>
                <span className="text-zinc-400 mr-2">:</span>
                <span className="w-24 text-right text-sm text-zinc-700 px-1.5">{aMinusB}</span>
              </div>
              <NumRow label="Starting Location of 1st Line from Left Edge" k="words_1st_start_left" />
              <NumRow label="Starting Location of 2nd Line from Left Edge" k="words_2nd_start_left" />
              <NumRow label="Width area" k="words_width" />
              <YesNoRow label="Print currency formal name" k="print_currency_formal_name" />

              <SectionTitle>Amount in Figures</SectionTitle>
              <NumRow label="Distance from Top Edge" k="figures_distance_top" />
              <NumRow label="Starting Location from Left Edge" k="figures_start_left" />
              <NumRow label="Width area" k="figures_width" />
              <YesNoRow label="Print Currency Symbol" k="print_currency_symbol" />
            </div>
          </div>

          {/* COMPANY SIGNATORY DETAILS (centered) */}
          <div className="mt-5">
            <div className="text-center text-sm font-bold text-zinc-900 mb-2">Company Signatory Details</div>
            <div className="max-w-[640px] mx-auto">
              <TextRow label="Company Name on Cheque" k="company_name_on_cheque" />
              <YesNoRow label="Print Company Name on Cheque" k="print_company_name" />
              <TextRow label="Salutation of 1st Signatory (if 2 signatories)" k="salutation_1st" />
              <TextRow label="Salutation of 2nd or Single Signatory" k="salutation_2nd" />
              <NumRow label="Distance from Top Edge" k="sign_distance_top" />
              <NumRow label="Starting Location from Left Edge" k="sign_start_left" />
              <NumRow label="Width of Signature area" k="sign_width" />
              <NumRow label="Height of Signature area" k="sign_height" />
            </div>
          </div>

          <div className="text-center text-xs italic text-zinc-500 mt-4">
            (To Preview the settings press Alt+P)
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-300 flex select-none">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 transition-colors">
            <span className="underline">Q</span>: Quit
          </button>
          <button onClick={commit} className="px-4 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 transition-colors">
            <span className="underline">A</span>: Accept
          </button>
        </div>
      </div>
    </div>
  );
}
