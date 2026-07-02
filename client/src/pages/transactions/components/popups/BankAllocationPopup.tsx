import { useState, useEffect, useCallback } from "react";
import { VoucherPopupShell } from "@/components/tally-ui/VoucherPopupShell";
import { toLocalIsoDate } from "@/lib/dueDate";

const TRANSACTION_TYPES = [
  "ATM",
  "Card",
  "Cheque",
  "ECS",
  "e-Fund Transfer",
  "Electronic Cheque",
  "Electronic DD/PO",
  "Cash",
  "Others",
] as const;

const TRANSFER_MODES = ["NEFT", "RTGS", "IMPS", "UPI", "Cheque"] as const;

/** Instrument types that move money bank-to-bank and therefore carry
 *  Bank Name / Favouring Name / Transfer Mode. */
const TRANSFER_TYPES = ["Cheque", "e-Fund Transfer"];

/** One allocation row. Additive shape — mirrors the legacy flat keys. */
export interface BankAllocationRow {
  transaction_type: string;
  cheque_range?: string;
  instrument_number: string;
  instrument_date: string;
  bank_name?: string;
  favouring_name?: string;
  transfer_mode?: string;
  account_number?: string;
  ifsc_code?: string;
  payment_gateway?: string;
  amount: number;
}

interface BankDetails {
  ledger_id: number;
  transaction_type: string;
  cheque_range?: string;
  instrument_number: string;
  instrument_date: string;
  bank_name?: string;
  favouring_name?: string;
  transfer_mode?: string;
  account_number?: string;
  ifsc_code?: string;
  payment_gateway?: string;
  amount: number;
  /** Additive: all allocation rows. Flat keys above mirror row 1 (back-compat). */
  allocations?: BankAllocationRow[];
}

interface Props {
  ledgerId: number;
  ledgerName: string;
  amount: number;
  initialDetails?: Partial<BankDetails> | null;
  onClose: () => void;
  onSave: (details: BankDetails) => void;
  allowCash?: boolean;
}

const todayIso = () => toLocalIsoDate(new Date());

function makeRow(partial?: Partial<BankAllocationRow>, fallbackAmount = 0): BankAllocationRow {
  return {
    transaction_type: partial?.transaction_type ?? "Cheque",
    cheque_range: partial?.cheque_range ?? "",
    instrument_number: partial?.instrument_number ?? "",
    instrument_date: partial?.instrument_date ?? todayIso(),
    bank_name: partial?.bank_name ?? "",
    favouring_name: partial?.favouring_name ?? "",
    transfer_mode: partial?.transfer_mode ?? "",
    account_number: partial?.account_number ?? "",
    ifsc_code: partial?.ifsc_code ?? "",
    payment_gateway: partial?.payment_gateway ?? "",
    amount: partial?.amount ?? fallbackAmount,
  };
}

function rowsFromDetails(
  details: Partial<BankDetails> | null | undefined,
  fallbackAmount: number
): BankAllocationRow[] {
  if (details?.allocations?.length) {
    return details.allocations.map((r) => makeRow(r, fallbackAmount));
  }
  return [makeRow(details ?? undefined, fallbackAmount)];
}

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Shared "label : input" row used across the allocation form.
function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-black w-44 shrink-0">{label}</span>
      <span className="text-sm text-black">:</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
      />
    </div>
  );
}

export default function BankAllocationPopup({
  ledgerId,
  ledgerName,
  amount,
  initialDetails,
  onClose,
  onSave,
  allowCash = true,
}: Props) {
  const [rows, setRows] = useState<BankAllocationRow[]>(() =>
    rowsFromDetails(initialDetails, amount)
  );
  const [activeRow, setActiveRow] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(rowsFromDetails(initialDetails, amount));
    setActiveRow(0);
  }, [ledgerId, amount, initialDetails]);

  const setRowField = (index: number, field: keyof BankAllocationRow, value: any) => {
    setError(null);
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, [field]: value };
        // Default the instrument date only when it is empty — never clobber a
        // date the user already entered just because the type changed.
        if (field === "transaction_type" && value === "Cheque" && !next.instrument_date) {
          next.instrument_date = todayIso();
        }
        return next;
      })
    );
  };

  const addRow = () => {
    setError(null);
    setRows((prev) => {
      const allocated = prev.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const remaining = Math.max(amount - allocated, 0);
      const next = [...prev, makeRow({ amount: remaining })];
      setActiveRow(next.length - 1);
      return next;
    });
  };

  const removeRow = (index: number) => {
    setError(null);
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      setActiveRow((a) => Math.min(a >= index ? Math.max(a - 1, 0) : a, next.length - 1));
      return next;
    });
  };

  const totalAllocated = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const handleSave = useCallback(() => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowLabel = rows.length > 1 ? `Row ${i + 1}: ` : "";
      if (!(Number(r.amount) > 0)) {
        setError(`${rowLabel}Amount must be greater than 0`);
        setActiveRow(i);
        return;
      }
      if (!r.instrument_date) {
        setError(`${rowLabel}Instrument date is required`);
        setActiveRow(i);
        return;
      }
      if (r.transaction_type === "Cheque" && !r.instrument_number.trim()) {
        setError(`${rowLabel}Instrument number is required for Cheque`);
        setActiveRow(i);
        return;
      }
    }
    if (amount > 0 && Math.abs(totalAllocated - amount) > 0.005) {
      setError(`Allocated total ${fmt(totalAllocated)} must equal ${fmt(amount)}`);
      return;
    }

    const first = rows[0];
    onSave({
      ledger_id: ledgerId,
      // Flat keys mirror row 1 for back-compat with existing consumers.
      transaction_type: first.transaction_type,
      cheque_range: first.cheque_range,
      instrument_number: first.instrument_number,
      instrument_date: first.instrument_date,
      bank_name: first.bank_name,
      favouring_name: first.favouring_name,
      transfer_mode: first.transfer_mode,
      account_number: first.account_number,
      ifsc_code: first.ifsc_code,
      payment_gateway: first.payment_gateway,
      amount: totalAllocated,
      allocations: rows,
    });
  }, [rows, totalAllocated, amount, ledgerId, onSave]);

  const availableTypes = allowCash
    ? TRANSACTION_TYPES
    : TRANSACTION_TYPES.filter((t) => t !== "Cash");

  const current = rows[Math.min(activeRow, rows.length - 1)];
  const isCheque = current.transaction_type === "Cheque";
  const isCash = current.transaction_type === "Cash";
  const isEFund = current.transaction_type === "e-Fund Transfer";
  const isTransfer = TRANSFER_TYPES.includes(current.transaction_type);
  const setCur = (field: keyof BankAllocationRow, value: any) =>
    setRowField(Math.min(activeRow, rows.length - 1), field, value);

  return (
    <VoucherPopupShell
      title={`Bank Allocations for: ${ledgerName}`}
      headerRight={
        <span>
          For: <span className="font-bold text-black">{fmt(totalAllocated)}</span>
        </span>
      }
      onClose={onClose}
      onAccept={handleSave}
      hint={`Alt+A: Accept · Esc: Close${isCash && allowCash ? " → Will open Denomination" : ""}`}
    >
      <div className="max-w-[960px]">
        {/* Transaction Type table — one line per allocation row */}
        <div className="grid grid-cols-[1fr_200px_32px] border-b border-gray-400 py-2 text-sm font-bold text-black">
          <div>Transaction Type</div>
          <div className="text-right">Amount</div>
          <div />
        </div>
        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-[1fr_200px_32px] border-b border-gray-200 py-2 text-sm items-center cursor-pointer ${
              i === activeRow ? "bg-gray-50" : ""
            }`}
            onClick={() => setActiveRow(i)}
          >
            <div>
              <select
                value={row.transaction_type}
                onChange={(e) => setRowField(i, "transaction_type", e.target.value)}
                onFocus={() => setActiveRow(i)}
                className="bg-white outline-none border border-gray-400 focus:border-black px-1 py-0.5 text-sm text-black w-44"
              >
                {availableTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <input
                type="number"
                min={0}
                step="0.01"
                value={Number.isFinite(row.amount) ? row.amount : ""}
                onChange={(e) => setRowField(i, "amount", e.target.value === "" ? 0 : Number(e.target.value))}
                onFocus={() => setActiveRow(i)}
                className="w-40 text-right font-mono text-sm text-black border border-gray-400 px-2 py-0.5 outline-none focus:border-black bg-white"
              />
            </div>
            <div className="text-right">
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeRow(i); }}
                  className="text-sm font-bold text-black px-1 hover:bg-gray-100"
                  aria-label={`Remove row ${i + 1}`}
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_200px_32px] py-2 text-sm items-center">
          <div>
            <button
              type="button"
              onClick={addRow}
              className="text-sm border border-black px-2 py-0.5 text-black hover:bg-gray-100"
            >
              + Add Row
            </button>
          </div>
          <div className="text-right font-mono font-bold text-black border-t border-black pt-1">
            {fmt(totalAllocated)}
          </div>
          <div />
        </div>

        {/* Form fields for the active row */}
        <div className="pt-4">
          {error && (
            <div className="mb-3 border border-black text-black text-xs font-bold px-3 py-2 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="font-bold">&times;</button>
            </div>
          )}

          {rows.length > 1 && (
            <div className="mb-2 text-xs font-bold text-black">
              Details for row {Math.min(activeRow, rows.length - 1) + 1} ({current.transaction_type})
            </div>
          )}

          {isEFund ? (
            /* e-Fund Transfer — A/c No. · IFS Code · Inst No. · Inst Date */
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              <Field label="A/c No." value={current.account_number ?? ""} onChange={(v) => setCur("account_number", v)} />
              <Field label="IFS Code" value={current.ifsc_code ?? ""} onChange={(v) => setCur("ifsc_code", v)} />
              <Field label="Inst No." value={current.instrument_number} onChange={(v) => setCur("instrument_number", v)} />
              <Field label="Inst Date" type="date" value={current.instrument_date} onChange={(v) => setCur("instrument_date", v)} />
            </div>
          ) : (
            <div className="space-y-3">
              {isCheque && (
                <Field label="Cheque range" value={current.cheque_range ?? ""} onChange={(v) => setCur("cheque_range", v)} />
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-black w-44 shrink-0">
                  {isCash ? "Ref No." : "Inst No."}
                </span>
                <span className="text-sm text-black">:</span>
                <input
                  type="text"
                  value={current.instrument_number}
                  onChange={(e) => setCur("instrument_number", e.target.value)}
                  className="text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black w-40 bg-white"
                />
                <span className="text-sm text-black ml-6 shrink-0">Inst Date</span>
                <span className="text-sm text-black">:</span>
                <input
                  type="date"
                  value={current.instrument_date}
                  onChange={(e) => setCur("instrument_date", e.target.value)}
                  className="text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black w-40 bg-white"
                />
              </div>
            </div>
          )}

          {/* Bank Name / Favouring Name / Transfer Mode — transfer-type
              instruments (Cheque, e-Fund Transfer), not Cash */}
          {isTransfer && (
            <div className="mt-3 space-y-3">
              <Field label="Bank Name" value={current.bank_name ?? ""} onChange={(v) => setCur("bank_name", v)} />
              <Field label="Favouring Name" value={current.favouring_name ?? ""} onChange={(v) => setCur("favouring_name", v)} />
              <div className="flex items-center gap-2">
                <span className="text-sm text-black w-44 shrink-0">Transfer Mode</span>
                <span className="text-sm text-black">:</span>
                <select
                  value={current.transfer_mode ?? ""}
                  onChange={(e) => setCur("transfer_mode", e.target.value)}
                  className="flex-1 text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
                >
                  <option value="">Not Applicable</option>
                  {TRANSFER_MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Bank Payment Gateway — always shown, for every transaction type */}
          <div className="mt-3">
            <Field label="Bank Payment Gateway" value={current.payment_gateway ?? ""} onChange={(v) => setCur("payment_gateway", v)} />
          </div>
        </div>
      </div>
    </VoucherPopupShell>
  );
}
