import { useState, useEffect, useRef } from "react";

export interface BomEntry {
  bomName: string;
  unitOfManufacture: string;
  items: { item: string; quantity: string }[];
}

interface BomComponentsModalProps {
  bomName: string;
  stockItemName: string;
  onClose: () => void;
  onAccept: (entry: BomEntry) => void;
}

export default function BomComponentsModal({
  bomName,
  stockItemName,
  onClose,
  onAccept,
}: BomComponentsModalProps) {
  const [unitOfManufacture, setUnitOfManufacture] = useState("");
  const [items, setItems] = useState([
    { item: "", quantity: "" },
    { item: "", quantity: "" },
    { item: "", quantity: "" },
  ]);
  const unitRef = useRef<HTMLInputElement>(null);

  useEffect(() => { unitRef.current?.focus(); }, []);

  const updateItem = (i: number, key: "item" | "quantity", v: string) =>
    setItems(prev => prev.map((x, j) => (j === i ? { ...x, [key]: v } : x)));

  const handleItemKeyDown = (e: React.KeyboardEvent, i: number, key: "item" | "quantity") => {
    if (e.key === "Tab" && !e.shiftKey && key === "quantity" && i === items.length - 1) {
      setItems(prev => [...prev, { item: "", quantity: "" }]);
    }
  };

  const accept = () => {
    onAccept({
      bomName,
      unitOfManufacture,
      items: items.filter(r => r.item.trim()),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    if (e.altKey && e.key.toLowerCase() === "a") { e.preventDefault(); accept(); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white border border-zinc-400 w-96 flex flex-col shadow-xl" style={{ minHeight: 300 }}>
        <div className="px-4 pt-3 pb-2 border-b border-zinc-200 space-y-0.5">
          <div className="flex items-center min-h-[22px] text-sm">
            <span className="w-44 text-zinc-600 shrink-0">BoM Name</span>
            <span className="text-zinc-400 mr-2">:</span>
            <span className="font-semibold text-zinc-900">{bomName}</span>
          </div>
          <div className="flex items-center min-h-[22px] text-sm">
            <span className="w-44 text-zinc-600 shrink-0">Components of</span>
            <span className="text-zinc-400 mr-2">:</span>
            <span className="font-semibold text-zinc-900">{stockItemName}</span>
          </div>
          <div className="flex items-center min-h-[22px] text-sm">
            <span className="w-44 text-zinc-600 shrink-0">Unit of manufacture</span>
            <span className="text-zinc-400 mr-2">:</span>
            <input
              ref={unitRef}
              className="flex-1 border-b border-zinc-400 bg-yellow-50 px-1 py-0 text-sm outline-none"
              value={unitOfManufacture}
              onChange={e => setUnitOfManufacture(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center border-b border-zinc-300 px-4 py-1 bg-zinc-50">
          <span className="flex-1 text-xs font-bold text-zinc-700">Item</span>
          <span className="w-28 text-xs font-bold text-zinc-700 text-right">Quantity</span>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 120 }}>
          {items.map((r, i) => (
            <div key={i} className="flex items-center border-b border-zinc-100">
              <input
                className="flex-1 px-4 py-0.5 text-sm outline-none bg-transparent hover:bg-zinc-50 focus:bg-yellow-50 border-r border-zinc-200"
                value={r.item}
                onChange={e => updateItem(i, "item", e.target.value)}
                onKeyDown={e => handleItemKeyDown(e, i, "item")}
              />
              <input
                className="w-28 px-2 py-0.5 text-sm outline-none bg-transparent text-right hover:bg-zinc-50 focus:bg-yellow-50 tabular-nums"
                value={r.quantity}
                onChange={e => updateItem(i, "quantity", e.target.value)}
                onKeyDown={e => handleItemKeyDown(e, i, "quantity")}
              />
            </div>
          ))}
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
