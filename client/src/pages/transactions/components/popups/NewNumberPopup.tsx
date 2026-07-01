import { useState, useEffect } from "react";

// Small Tally-style "New Number" entry popup. Opened when the user picks
// "New Number" from a Tracking No. / Order No. / Batch-Lot list — a single
// text field to type the new number, Accept/Cancel. Renders above the parent
// allocation popup (z-60).
interface Props {
  title?: string;
  label?: string;
  initial?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export default function NewNumberPopup({
  title = "New Number",
  label = "Number",
  initial = "",
  onConfirm,
  onClose,
}: Props) {
  const [value, setValue] = useState(initial);

  const confirm = () => {
    const v = value.trim();
    if (v) onConfirm(v);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 select-none"
      onMouseDown={onClose}
    >
      <div className="bg-white border border-black shadow-2xl w-72" onMouseDown={(e) => e.stopPropagation()}>
        <div className="bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider">{title}</div>
        <div className="p-4 flex items-center gap-2">
          <span className="text-xs text-zinc-700 shrink-0">{label}</span>
          <span className="text-xs text-zinc-400">:</span>
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirm(); } }}
            className="flex-1 text-xs border border-zinc-300 px-2 py-1 outline-none focus:border-zinc-800 font-mono bg-yellow-50"
          />
        </div>
        <div className="border-t border-zinc-200 px-3 py-2 flex justify-end gap-2 bg-zinc-50">
          <button onClick={onClose} className="text-xs px-3 py-1 border border-zinc-300 text-zinc-700 hover:bg-zinc-100">Cancel</button>
          <button onClick={confirm} className="text-xs px-4 py-1 bg-zinc-900 text-white hover:bg-zinc-700 font-semibold">Accept</button>
        </div>
      </div>
    </div>
  );
}
