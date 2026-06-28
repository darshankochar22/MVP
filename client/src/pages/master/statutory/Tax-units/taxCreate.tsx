import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { INDIAN_STATES } from "@/constants/states";
import { FormRow, PageTitleBar, RightActionPanel } from "@/components/ui";
import RightPanel from "@/components/RightPanel.tsx";
import type { TaxUnitType } from "@/types/entities";
import {
  REGISTRATION_TYPES,
  MANUFACTURER_TYPES,
  VALUATION_TYPES,
  EXCISE_REPORTING_UOMS,
  showsRatePercent,
  showsRatePerUnit,
} from "./taxUnitsConstants";

// ── Field styling — strict black/white/zinc (focus shown via border, NOT colour) ──
const activeClass =
  "bg-zinc-100 border-zinc-800 text-zinc-950 px-2 py-0.5 outline-none border w-64 font-mono font-bold text-xs uppercase";
const inactiveClass =
  "bg-transparent border-transparent text-zinc-900 px-2 py-0.5 outline-none border hover:border-zinc-200 w-64 font-mono font-bold text-xs uppercase";
const fieldCls = (isActive: boolean) => (isActive ? activeClass : inactiveClass);
const popupInput =
  "w-64 bg-zinc-50 border border-zinc-300 text-zinc-950 px-2 py-0.5 outline-none focus:border-zinc-800 font-mono font-bold text-xs";

// ─── Tariff + Rule 11 state shared with the Excise Details popup ─────────────────
interface Tariff {
  name: string;
  hsn: string;
  uom: string;
  valuationType: string;
  rate: string;
  ratePerUnit: string;
}
const EMPTY_TARIFF: Tariff = { name: "", hsn: "", uom: "Undefined", valuationType: "Undefined", rate: "", ratePerUnit: "" };

// ═══════════════════ Excise Tariff Details (nested popup) ═══════════════════
function ExciseTariffPopup({
  tariff,
  setTariff,
  onClose,
}: {
  tariff: Tariff;
  setTariff: (t: Tariff) => void;
  onClose: () => void;
}) {
  const upd = (patch: Partial<Tariff>) => setTariff({ ...tariff, ...patch });
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] font-mono text-[11px]">
      <div className="bg-white border border-zinc-800 shadow-2xl w-[520px] p-5">
        <div className="text-center font-bold text-xs pb-3 border-b border-zinc-200 uppercase tracking-wide">
          Excise Tariff Details
        </div>
        <div className="py-4 space-y-2">
          <FormRow label="Tariff name" labelWidth="w-52">
            <input autoFocus className={popupInput} value={tariff.name} onChange={(e) => upd({ name: e.target.value })} />
          </FormRow>
          <FormRow label="HSN code" labelWidth="w-52">
            <input className={popupInput} value={tariff.hsn} onChange={(e) => upd({ hsn: e.target.value })} />
          </FormRow>
          <FormRow label="Reporting unit of measure" labelWidth="w-52">
            <select className={popupInput} value={tariff.uom} onChange={(e) => upd({ uom: e.target.value })}>
              {EXCISE_REPORTING_UOMS.map((u) => (
                <option key={u.code} value={u.code}>{u.code === "Undefined" ? "Undefined" : `${u.code} — ${u.label}`}</option>
              ))}
            </select>
          </FormRow>
          <FormRow label="Valuation type" labelWidth="w-52">
            <select className={popupInput} value={tariff.valuationType} onChange={(e) => upd({ valuationType: e.target.value })}>
              {VALUATION_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </FormRow>
          {showsRatePercent(tariff.valuationType) && (
            <FormRow label="Rate" labelWidth="w-52">
              <span className="flex items-center gap-1">
                <input type="number" min={0} step="0.01" className="w-44 bg-zinc-50 border border-zinc-300 px-2 py-0.5 outline-none focus:border-zinc-800 font-mono font-bold text-xs text-right"
                  value={tariff.rate} onChange={(e) => upd({ rate: e.target.value })} />
                <span className="text-zinc-500">%</span>
              </span>
            </FormRow>
          )}
          {showsRatePerUnit(tariff.valuationType) && (
            <FormRow label="Rate per Unit" labelWidth="w-52">
              <input type="number" min={0} step="0.01" className="w-44 bg-zinc-50 border border-zinc-300 px-2 py-0.5 outline-none focus:border-zinc-800 font-mono font-bold text-xs text-right"
                value={tariff.ratePerUnit} onChange={(e) => upd({ ratePerUnit: e.target.value })} />
            </FormRow>
          )}
        </div>
        <div className="border-t border-zinc-200 pt-3 flex justify-end">
          <button onClick={onClose} className="text-[11px] px-4 py-1 border border-zinc-800 bg-zinc-900 text-white hover:bg-black font-bold">Ok</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ Excise Book selection (Rule 11, nested popup) ═══════════════════
function ExciseBookPopup({
  companyId,
  onPick,
  onClose,
}: {
  companyId?: number;
  onPick: (name: string) => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [books, setBooks] = useState<{ excise_book_id: number; name: string }[]>([]);
  useEffect(() => {
    if (!companyId) return;
    window.api.exciseBook.getAll(companyId).then((r: any) => {
      if (r.success) setBooks(r.books ?? r.exciseBooks ?? r.data ?? []);
    });
  }, [companyId]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] font-mono text-[11px]">
      <div className="bg-white border border-zinc-800 shadow-2xl w-[320px] max-h-[70vh] flex flex-col">
        <div className="text-center font-bold text-xs py-2 border-b border-zinc-800 bg-zinc-900 text-white uppercase tracking-wide">
          Excise Book
        </div>
        <div className="flex-1 overflow-y-auto">
          {books.length === 0 && (
            <div className="px-3 py-3 text-zinc-400 text-[11px]">No excise books yet.</div>
          )}
          {books.map((b, i) => (
            <button key={b.excise_book_id ?? i} onClick={() => onPick(b.name)}
              className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 hover:text-white border-b border-zinc-100">
              {i + 1}. {b.name}
            </button>
          ))}
        </div>
        <div className="border-t border-zinc-200 flex">
          <button onClick={() => navigate("/master/create/excise-book")}
            className="flex-1 py-2 text-center hover:bg-zinc-100 border-r border-zinc-200 font-bold">Create</button>
          <button onClick={onClose} className="flex-1 py-2 text-center hover:bg-zinc-100">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ Excise Details popup ═══════════════════
function ExciseDetailsPopup({
  companyId,
  unitName,
  registrationType,
  setRegistrationType,
  typeOfManufacturer,
  setTypeOfManufacturer,
  eccNumber,
  setEccNumber,
  setAlterTariff,
  setSetAlterTariff,
  tariff,
  setTariff,
  setAlterRule11,
  setSetAlterRule11,
  rule11Book,
  setRule11Book,
  onClose,
}: {
  companyId?: number;
  unitName: string;
  registrationType: string;
  setRegistrationType: (v: string) => void;
  typeOfManufacturer: string;
  setTypeOfManufacturer: (v: string) => void;
  eccNumber: string;
  setEccNumber: (v: string) => void;
  setAlterTariff: boolean;
  setSetAlterTariff: (v: boolean) => void;
  tariff: Tariff;
  setTariff: (t: Tariff) => void;
  setAlterRule11: boolean;
  setSetAlterRule11: (v: boolean) => void;
  rule11Book: string;
  setRule11Book: (v: string) => void;
  onClose: () => void;
}) {
  const isManufacturer = registrationType === "Manufacturer";
  const [showTariff, setShowTariff] = useState(false);
  const [showBook, setShowBook] = useState(false);

  useEffect(() => {
    if (showTariff || showBook) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, showTariff, showBook]);

  const toggleTariff = (v: boolean) => { setSetAlterTariff(v); if (v) setShowTariff(true); };
  const toggleRule11 = (v: boolean) => { setSetAlterRule11(v); if (v) setShowBook(true); };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 font-mono text-[11px]">
      <div className="bg-white border border-zinc-800 shadow-2xl w-[580px] p-5">
        <div className="text-center font-bold text-xs pb-3 border-b border-zinc-200 uppercase tracking-wide">
          Excise Details
          <span className="text-zinc-500 text-[10px] italic ml-1">({registrationType} Unit)</span>
        </div>

        <div className="py-4 space-y-2">
          <FormRow label="Unit name" labelWidth="w-56">
            <span className="font-bold text-zinc-950 uppercase px-2 py-0.5">{unitName || "—"}</span>
          </FormRow>

          <FormRow label="Registration type" labelWidth="w-56">
            <select className={popupInput} value={registrationType} onChange={(e) => setRegistrationType(e.target.value)}>
              {REGISTRATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormRow>

          {isManufacturer && (
            <FormRow label="Type of manufacturer" labelWidth="w-56">
              <select className={popupInput} value={typeOfManufacturer} onChange={(e) => setTypeOfManufacturer(e.target.value)}>
                {MANUFACTURER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormRow>
          )}

          <FormRow label="ECC number" labelWidth="w-56">
            <input className={popupInput} value={eccNumber} onChange={(e) => setEccNumber(e.target.value)} />
          </FormRow>

          <FormRow label="Set/alter excise tariff details" labelWidth="w-56">
            <select className={popupInput} value={setAlterTariff ? "Yes" : "No"} onChange={(e) => toggleTariff(e.target.value === "Yes")}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </FormRow>
          {setAlterTariff && tariff.name && (
            <div className="pl-[15rem] text-[10px] text-zinc-500 italic">{tariff.name} · {tariff.valuationType}</div>
          )}

          <FormRow label="Set/alter Rule 11 book details" labelWidth="w-56">
            <select className={popupInput} value={setAlterRule11 ? "Yes" : "No"} onChange={(e) => toggleRule11(e.target.value === "Yes")}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </FormRow>
          {setAlterRule11 && rule11Book && (
            <div className="pl-[15rem] text-[10px] text-zinc-500 italic">Book: {rule11Book}</div>
          )}
        </div>

        <div className="border-t border-zinc-200 pt-3 flex justify-end gap-3">
          <button onClick={onClose} className="text-[11px] px-4 py-1 border border-zinc-800 bg-zinc-900 text-white hover:bg-black font-bold">Ok</button>
        </div>
      </div>

      {showTariff && (
        <ExciseTariffPopup tariff={tariff} setTariff={setTariff} onClose={() => setShowTariff(false)} />
      )}
      {showBook && (
        <ExciseBookPopup companyId={companyId} onPick={(name) => { setRule11Book(name); setShowBook(false); }} onClose={() => setShowBook(false)} />
      )}
    </div>
  );
}

const FIELDS = ["name", "alias", "address", "state", "pincode", "telephone", "setAlterExciseDetails"];

export default function TaxCreate() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;

  const [form, setForm] = useState({
    name: "", alias: "", address: "", state: "", pincode: "", telephone: "", setAlterExciseDetails: false,
  });

  // Excise sub-details (saved with the tax unit)
  const [registrationType, setRegistrationType] = useState("Importer");
  const [typeOfManufacturer, setTypeOfManufacturer] = useState("Regular");
  const [eccNumber, setEccNumber] = useState("");
  const [setAlterTariff, setSetAlterTariff] = useState(false);
  const [tariff, setTariff] = useState<Tariff>({ ...EMPTY_TARIFF });
  const [setAlterRule11, setSetAlterRule11] = useState(false);
  const [rule11Book, setRule11Book] = useState("");

  const [showExcisePopup, setShowExcisePopup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeField, setActiveField] = useState("name");
  const [showAccept, setShowAccept] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const aliasRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLSelectElement>(null);
  const pincodeRef = useRef<HTMLInputElement>(null);
  const telephoneRef = useRef<HTMLInputElement>(null);
  const setAlterExciseDetailsRef = useRef<HTMLSelectElement>(null);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleExciseToggle = (val: boolean) => {
    setForm((prev) => ({ ...prev, setAlterExciseDetails: val }));
    if (val) setShowExcisePopup(true);
  };

  const resetForm = () => {
    setForm({ name: "", alias: "", address: "", state: "", pincode: "", telephone: "", setAlterExciseDetails: false });
    setRegistrationType("Importer");
    setTypeOfManufacturer("Regular");
    setEccNumber("");
    setSetAlterTariff(false);
    setTariff({ ...EMPTY_TARIFF });
    setSetAlterRule11(false);
    setRule11Book("");
    setActiveField("name");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!companyId) { setError("No company selected"); return; }
    setSaving(true);
    setError(null);

    const payload: TaxUnitType = {
      company_id: companyId,
      name: form.name,
      alias: form.alias || undefined,
      address_line1: form.address || undefined,
      state: form.state || undefined,
      pincode: form.pincode || undefined,
      telephone: form.telephone || undefined,
      registered_for: "Excise",
      set_alter_excise_details: form.setAlterExciseDetails ? 1 : 0,
      registration_type: registrationType,
      type_of_manufacturer: registrationType === "Manufacturer" ? typeOfManufacturer : undefined,
      ecc_number: eccNumber || undefined,
      set_alter_excise_tariff: setAlterTariff ? 1 : 0,
      tariff_name: setAlterTariff ? tariff.name || undefined : undefined,
      hsn_code: setAlterTariff ? tariff.hsn || undefined : undefined,
      reporting_uom: setAlterTariff ? tariff.uom || undefined : undefined,
      valuation_type: setAlterTariff ? tariff.valuationType || undefined : undefined,
      tariff_rate: setAlterTariff ? Number(tariff.rate) || 0 : undefined,
      tariff_rate_per_unit: setAlterTariff ? Number(tariff.ratePerUnit) || 0 : undefined,
      set_alter_rule11_book: setAlterRule11 ? 1 : 0,
      rule11_book: setAlterRule11 ? rule11Book || undefined : undefined,
    };

    try {
      const result = await window.api.taxUnits.create(payload);
      if (result.success) resetForm();
      else setError(result.error || "Failed to save tax unit");
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleQuit = () => navigate("/master/create");

  useEffect(() => {
    if (showExcisePopup) return;

    if (showAccept) {
      const handler = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (key === "y" || e.key === "Enter") { e.preventDefault(); setShowAccept(false); handleSave(); }
        else if (key === "n" || e.key === "Escape") { e.preventDefault(); setShowAccept(false); }
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); handleQuit(); return; }
      if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === "a") { e.preventDefault(); setShowAccept(true); return; }
      if (e.altKey && e.key.toLowerCase() === "c") { e.preventDefault(); navigate("/master/alter/tax-units"); return; }

      const idx = FIELDS.indexOf(activeField);
      if (idx !== -1) {
        if (e.key === "Enter" || e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
          e.preventDefault();
          if (idx === FIELDS.length - 1) setShowAccept(true);
          else setActiveField(FIELDS[idx + 1]);
          return;
        }
        if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
          e.preventDefault();
          if (idx > 0) setActiveField(FIELDS[idx - 1]);
          return;
        }
        if (activeField === "setAlterExciseDetails") {
          const key = e.key.toLowerCase();
          if (key === "y" || key === "n") {
            e.preventDefault();
            const val = key === "y";
            handleExciseToggle(val);
            if (!val) setShowAccept(true);
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, navigate, companyId, activeField, showExcisePopup, showAccept]);

  useEffect(() => {
    if (showExcisePopup) return;
    const refMap: Record<string, React.RefObject<HTMLInputElement | HTMLSelectElement | null>> = {
      name: nameRef, alias: aliasRef, address: addressRef, state: stateRef,
      pincode: pincodeRef, telephone: telephoneRef, setAlterExciseDetails: setAlterExciseDetailsRef,
    };
    refMap[activeField]?.current?.focus();
  }, [activeField, showExcisePopup]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-100 font-mono text-[11px] select-none text-zinc-950">
      <PageTitleBar title="Tax Unit Creation" />

      <div className="flex flex-1 min-h-0 relative">
        <div className="flex-1 bg-white border-r border-zinc-300 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-1.5 flex-1 max-w-2xl">

            {error && (
              <div className="mb-2 px-2 py-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>
            )}

            <FormRow label="Name" labelWidth="w-56">
              <input ref={nameRef} className={fieldCls(activeField === "name")} value={form.name} onChange={set("name")} onFocus={() => setActiveField("name")} />
            </FormRow>

            <FormRow label="(alias)" labelWidth="w-56">
              <input ref={aliasRef} className={fieldCls(activeField === "alias")} value={form.alias} onChange={set("alias")} onFocus={() => setActiveField("alias")} />
            </FormRow>

            <div className="py-2" />

            {/* Address — single line, on the same row as its label */}
            <FormRow label="Address" labelWidth="w-56">
              <input ref={addressRef} className={`${fieldCls(activeField === "address")} normal-case`} value={form.address} onChange={set("address")} onFocus={() => setActiveField("address")} />
            </FormRow>

            <div className="py-2" />

            <FormRow label="State" labelWidth="w-56">
              <select ref={stateRef} className={fieldCls(activeField === "state")} value={form.state}
                onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} onFocus={() => setActiveField("state")}>
                <option value="">Not Applicable</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormRow>

            <FormRow label="Pincode" labelWidth="w-56">
              <input ref={pincodeRef} className={fieldCls(activeField === "pincode")} value={form.pincode} onChange={set("pincode")} onFocus={() => setActiveField("pincode")} />
            </FormRow>

            <FormRow label="Telephone" labelWidth="w-56">
              <input ref={telephoneRef} className={fieldCls(activeField === "telephone")} value={form.telephone} onChange={set("telephone")} onFocus={() => setActiveField("telephone")} />
            </FormRow>

            <div className="py-2" />

            <FormRow label="Registered for" labelWidth="w-56">
              <span className="font-bold text-zinc-950 px-2 py-0.5">Excise</span>
            </FormRow>

            <div className="py-2" />

            <FormRow label="Set/alter excise details" labelWidth="w-56">
              <select ref={setAlterExciseDetailsRef} className={fieldCls(activeField === "setAlterExciseDetails")}
                value={form.setAlterExciseDetails ? "Yes" : "No"} onChange={(e) => handleExciseToggle(e.target.value === "Yes")} onFocus={() => setActiveField("setAlterExciseDetails")}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </FormRow>

          </div>

          <div className="border-t border-zinc-200 flex text-xs shrink-0 font-sans">
            <button onClick={handleQuit} disabled={saving} className="flex-1 py-2 text-center hover:bg-zinc-100 border-r border-zinc-200 disabled:opacity-50">Quit (Esc)</button>
            <button onClick={() => setShowAccept(true)} disabled={saving} className="flex-1 py-2 text-center hover:bg-zinc-100 disabled:opacity-50 font-bold">Accept (Alt+A)</button>
          </div>
        </div>

        <div className="w-64 flex-shrink-0 bg-zinc-50 border-l border-zinc-300 flex flex-col font-sans">
          <RightPanel />
          <RightActionPanel actions={[
            { key: "Alt+A", label: saving ? "Saving..." : "Accept", onClick: () => setShowAccept(true) },
            { key: "Esc", label: "Quit", onClick: handleQuit },
          ]} />
        </div>
      </div>

      {showExcisePopup && (
        <ExciseDetailsPopup
          companyId={companyId}
          unitName={form.name}
          registrationType={registrationType}
          setRegistrationType={setRegistrationType}
          typeOfManufacturer={typeOfManufacturer}
          setTypeOfManufacturer={setTypeOfManufacturer}
          eccNumber={eccNumber}
          setEccNumber={setEccNumber}
          setAlterTariff={setAlterTariff}
          setSetAlterTariff={setSetAlterTariff}
          tariff={tariff}
          setTariff={setTariff}
          setAlterRule11={setAlterRule11}
          setSetAlterRule11={setSetAlterRule11}
          rule11Book={rule11Book}
          setRule11Book={setRule11Book}
          onClose={() => setShowExcisePopup(false)}
        />
      )}

      {showAccept && (
        <div className="absolute bottom-16 right-72 bg-white border border-zinc-800 w-[165px] shadow-2xl p-3 flex flex-col items-center z-[10000] font-mono text-zinc-950">
          <h4 className="font-bold text-[11px] mb-3">Accept?</h4>
          <div className="flex items-center gap-3 w-full justify-center">
            <button onClick={() => { setShowAccept(false); handleSave(); }} disabled={saving}
              className="text-[11px] px-3 py-0.5 border border-zinc-800 bg-zinc-900 text-white hover:bg-black font-bold focus:outline-none min-w-[55px] text-center disabled:opacity-50">Yes</button>
            <button onClick={() => setShowAccept(false)}
              className="text-[11px] px-3 py-0.5 border border-zinc-300 hover:bg-zinc-100 text-zinc-800 font-bold focus:outline-none min-w-[55px] text-center">No</button>
          </div>
        </div>
      )}
    </div>
  );
}
