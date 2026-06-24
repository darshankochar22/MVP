interface LedgerFlatListProps {
  ledgers: any[];
  selectedId?: number | null;
  onSelect?: (ledger: any) => void;
  onCreate?: () => void;
  onClose?: () => void;
  showHeader?: boolean;
}

export default function LedgerFlatList({
  ledgers,
  selectedId,
  onSelect,
  onCreate,
  onClose,
  showHeader = true,
}: LedgerFlatListProps) {
  const sorted = [...ledgers].sort((a, b) =>
    (a.name || a.ledger_name || "").localeCompare(b.name || b.ledger_name || "")
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {showHeader && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 bg-zinc-50 select-none">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            List of Ledgers
          </span>
          <div className="flex items-center gap-3">
            {onCreate && (
              <button onClick={onCreate}
                className="text-[11px] text-zinc-500 hover:text-zinc-800 font-medium transition-colors">
                + Create
              </button>
            )}
            {onClose && (
              <button onClick={onClose}
                className="text-sm font-bold text-zinc-400 hover:text-zinc-800 transition-colors">
                &times;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create option at top like Tally */}
      {onCreate && (
        <div
          onClick={onCreate}
          className="px-3 py-1.5 text-[12px] font-bold text-zinc-700 bg-[#ffcc33] cursor-pointer hover:bg-[#ffdd55] border-b border-zinc-200 select-none"
        >
          Create
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="text-sm text-zinc-400 p-4">No ledgers found</div>
        ) : (
          sorted.map((ledger) => {
            const id = ledger.ledger_id;
            const name = ledger.name || ledger.ledger_name || "—";
            const isSelected = id === selectedId;
            return (
              <div
                key={id}
                onClick={() => onSelect?.(ledger)}
                className={`flex items-center min-h-[26px] px-3 cursor-pointer text-[12px] select-none border-b border-zinc-50 ${
                  isSelected
                    ? "bg-zinc-100 font-semibold text-black"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span className="truncate">{name}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}