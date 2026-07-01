import type { ParticularRow } from "../hooks/useVoucherForm";

// Nested inventory display shown under a Journal/Reversing Journal ledger row that
// carries stock (Purchase/Sales A/c): item qty/rate/amount, its Actuals line, and
// the per-item cost-centre split — mirroring TallyPrime's voucher body.

const fmt = (n: number) =>
  n ? n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

export default function InventoryAllocLines({
  inventoryAllocations,
  dcType,
}: {
  inventoryAllocations?: ParticularRow["inventoryAllocations"];
  dcType: "Dr" | "Cr";
}) {
  if (!inventoryAllocations?.length) return null;

  return (
    <div className="pl-2 mt-0.5 space-y-1 text-[10px] text-zinc-700 leading-tight select-none">
      {inventoryAllocations.map((it, i) => (
        <div key={i}>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold">{it.item_name}</span>
            <span className="font-mono">{it.quantity || ""} {it.unit_symbol ?? ""}</span>
            <span className="font-mono">{fmt(it.rate)} {it.unit_symbol ?? ""}</span>
            <span className="font-mono font-semibold">{fmt(it.amount)}</span>
          </div>
          {it.actual_quantity ? (
            <div className="pl-3 text-zinc-500 italic">
              Actuals: {it.actual_quantity} {it.unit_symbol ?? ""}
            </div>
          ) : null}
          {it.cost_centres?.length ? (
            <div className="pl-3">
              <div className="text-zinc-500 italic">Primary Cost Category</div>
              {it.cost_centres.map((cc, ci) => (
                <div key={ci} className="pl-3 flex items-baseline gap-x-2">
                  <span className="font-semibold">{cc.cost_centre_name ?? `#${cc.cost_centre_id}`}</span>
                  <span className="font-mono">{fmt(cc.amount)} {dcType}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
