import { useEffect, useState } from "react";
import type { ChequeRange } from "./BankDetailsPopup";

interface ChequeRangePopupProps {
  ledgerName: string;
  ranges: ChequeRange[];
  onClose: () => void;
  onAccept: (ranges: ChequeRange[]) => void;
}

const EMPTY_ROW: ChequeRange = { from_number: "", to_number: "", name: "" };

/** Number of cheques in a range = To - From + 1 (inclusive). Uses BigInt so
 *  long cheque numbers stay exact. Blank when incomplete or invalid (To < From). */
function chequeCount(row: ChequeRange): string {
  const f = (row.from_number ?? "").trim();
  const t = (row.to_number ?? "").trim();
  if (!/^\d+$/.test(f) || !/^\d+$/.test(t)) return "";
  const from = BigInt(f);
  const to = BigInt(t);
  if (to < from) return "";
  return (to - from + 1n).toString();
}

const isRowEmpty = (r: ChequeRange) => !r.from_number && !r.to_number && !r.name;

export default function ChequeRangePopup({
  ledgerName,
  ranges,
  onClose,
  onAccept,
}: ChequeRangePopupProps) {
  // Always keep exactly one trailing blank row for entry.
  const [rows, setRows] = useState<ChequeRange[]>(() => [
    ...ranges.filter((r) => !isRowEmpty(r)),
    { ...EMPTY_ROW },
  ]);

  const commit = () => onAccept(rows.filter((r) => !isRowEmpty(r)));

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
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateCell = (idx: number, key: keyof ChequeRange, value: string) => {
    setRows((prev) => {
      const next = prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r));
      // Ensure a single trailing blank row when the last row gets filled.
      if (idx === next.length - 1 && !isRowEmpty(next[idx])) {
        next.push({ ...EMPTY_ROW });
      }
      return next;
    });
  };

  const removeRow = (idx: number) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length === 0 || !isRowEmpty(next[next.length - 1])) next.push({ ...EMPTY_ROW });
      return next;
    });
  };

  const cellInput =
    "w-full bg-transparent text-sm text-zinc-900 outline-none px-3 py-1.5 border border-transparent focus:border-zinc-800 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/10 pt-20" onClick={onClose}>
      <div
        className="bg-white border border-zinc-400 shadow-lg flex flex-col"
        style={{ width: 880, maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="border-b border-zinc-300 text-center py-2 select-none">
          <span className="text-sm text-zinc-700">Cheque Range for:&nbsp;&nbsp;</span>
          <span className="text-sm font-bold text-zinc-900">{ledgerName || "—"}</span>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1.4fr] border-b border-zinc-800 bg-white select-none">
          {["From Number", "To Number", "Number of Cheques", "Name of Cheque Book"].map((h, i) => (
            <div
              key={h}
              className={`px-3 py-2 text-sm font-bold text-zinc-900 text-center ${i < 3 ? "border-r border-zinc-200" : ""}`}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {rows.map((row, idx) => {
            const last = idx === rows.length - 1;
            return (
              <div
                key={idx}
                className={`group grid grid-cols-[1fr_1fr_1fr_1.4fr] border-b border-zinc-100 ${last ? "bg-zinc-50" : "bg-white"}`}
              >
                <div className="border-r border-zinc-100">
                  <input
                    className={`${cellInput} text-right`}
                    inputMode="numeric"
                    value={row.from_number}
                    onChange={(e) => updateCell(idx, "from_number", e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>
                <div className="border-r border-zinc-100">
                  <input
                    className={`${cellInput} text-right`}
                    inputMode="numeric"
                    value={row.to_number}
                    onChange={(e) => updateCell(idx, "to_number", e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>
                <div className="border-r border-zinc-100 flex items-center justify-end px-3 py-1.5">
                  <span className="text-sm text-zinc-700">{chequeCount(row)}</span>
                </div>
                <div className="flex items-center">
                  <input
                    className={cellInput}
                    value={row.name}
                    onChange={(e) => updateCell(idx, "name", e.target.value)}
                  />
                  {!last && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="px-2 text-zinc-300 hover:text-zinc-800 opacity-0 group-hover:opacity-100 transition"
                      title="Remove row"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
