import { useState, useEffect, useRef } from "react";

interface BomListModalProps {
  stockItemName: string;
  existingBoms: string[];
  onSelectBom: (name: string) => void;
  onClose: () => void;
}

export default function BomListModal({
  stockItemName,
  existingBoms,
  onSelectBom,
  onClose,
}: BomListModalProps) {
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const accept = () => {
    const trimmed = newName.trim();
    if (trimmed) onSelectBom(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    if (e.key === "Enter") { e.preventDefault(); accept(); }
    if (e.altKey && e.key.toLowerCase() === "a") { e.preventDefault(); accept(); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white border border-zinc-400 w-72 flex flex-col shadow-xl" style={{ minHeight: 180 }}>
        <div className="text-center text-sm font-semibold text-zinc-900 pt-3 pb-2 px-3 border-b border-zinc-300">
          BOM List of : <span className="font-bold">{stockItemName}</span>
        </div>
        <div className="px-3 py-1.5 border-b border-zinc-200 bg-zinc-50">
          <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Name of BOM</span>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 80 }}>
          {existingBoms.map((b, i) => (
            <div
              key={i}
              className="px-3 py-1 text-sm cursor-pointer hover:bg-zinc-100 border-b border-zinc-100"
              onClick={() => onSelectBom(b)}
            >
              {b}
            </div>
          ))}
          <input
            ref={inputRef}
            className="w-full px-3 py-1 text-sm outline-none bg-yellow-50 border-b border-zinc-200"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Type new BOM name..."
          />
        </div>
        <div className="border-t border-zinc-300 flex text-xs bg-zinc-50 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 border-r border-zinc-300 hover:bg-zinc-100 text-left px-3 transition-colors"
          >
            <span className="font-bold">Q</span>: Quit
          </button>
          <button
            onClick={accept}
            className="flex-1 py-1.5 hover:bg-zinc-100 text-left px-3 transition-colors"
          >
            <span className="font-bold">A</span>: Accept
          </button>
        </div>
      </div>
    </div>
  );
}
