import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import {
  PageTitleBar,
  RightActionPanel,
  MasterFormFooter,
  AlertBanner,
} from "@/components/ui";
import LedgerListPanel from "@/pages/transactions/components/LedgerListPanel";
import PartyDetailsPopup, {
  type PartyDetails,
} from "@/pages/transactions/components/popups/PartyDetailsPopup";
import ReceiptDetailsPopup, {
  type ReceiptDetails,
} from "@/pages/transactions/components/popups/ReceiptDetailsPopup";
import type { LedgerType } from "@/types/entities/Ledger";
import type { StockItemType } from "@/types/entities/StockItem";
import type { UnitType } from "@/types/entities/Unit";
import type { GodownType } from "@/types/entities/Godown";

interface StockRow {
  id: number;
  stockItem: StockItemType | null;
  quantityRaw: string;
  billedQtyRaw: string;
  rateRaw: string;
  discPercentRaw: string;
  unit: UnitType | null;
  godownAllocations: GodownAllocation[];
}

interface GodownAllocation {
  godown_id: number | null;
  godown_name: string;
  actualRaw: string;
  billedRaw: string;
  rateRaw: string;
}

let rowSeq = 1;
const blankRow = (): StockRow => ({
  id: rowSeq++,
  stockItem: null,
  quantityRaw: "",
  billedQtyRaw: "",
  rateRaw: "",
  discPercentRaw: "",
  unit: null,
  godownAllocations: [],
});

const inr = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const rowAmount = (r: StockRow): number => {
  const qty = Number(r.billedQtyRaw || r.quantityRaw) || 0;
  const rate = Number(r.rateRaw) || 0;
  const disc = Number(r.discPercentRaw) || 0;
  const gross = qty * rate;
  return gross - (gross * disc) / 100;
};

export default function DealerExciseOpeningStockCreate() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();
  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;

  // FY start year → opening date 1-Apr-<FY>
  const fyStartYear = useMemo(() => {
    if (activeFY?.start_date) return Number(activeFY.start_date.slice(0, 4));
    return new Date().getFullYear();
  }, [activeFY]);
  const openingDate = `${fyStartYear}-04-01`;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // header
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [partyLedger, setPartyLedger] = useState<LedgerType | null>(null);
  const [partyBalance, setPartyBalance] = useState<string>("");
  const [partyDetails, setPartyDetails] = useState<PartyDetails | null>(null);
  const [purchaseLedger, setPurchaseLedger] = useState<LedgerType | null>(null);
  const [narration, setNarration] = useState("");
  const [receiptDetails, setReceiptDetails] = useState<ReceiptDetails | null>(null);

  // data
  const [allLedgers, setAllLedgers] = useState<LedgerType[]>([]);
  const [allStockItems, setAllStockItems] = useState<StockItemType[]>([]);
  const [stockBalances, setStockBalances] = useState<Record<number, number>>({});
  const [allUnits, setAllUnits] = useState<UnitType[]>([]);
  const [allGodowns, setAllGodowns] = useState<GodownType[]>([]);

  // grid
  const [rows, setRows] = useState<StockRow[]>([blankRow()]);

  // popups
  const [partyPanelOpen, setPartyPanelOpen] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [partyDetailsOpen, setPartyDetailsOpen] = useState(false);
  const [purchasePanelOpen, setPurchasePanelOpen] = useState(false);
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [itemPanelRow, setItemPanelRow] = useState<number | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [godownRowId, setGodownRowId] = useState<number | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // ── load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      try {
        const [ledRes, itemRes, balRes, unitRes, godRes] = await Promise.all([
          window.api.ledger.getAll(companyId),
          window.api.stockItem.getAll(companyId),
          window.api.stockItem.getStockBalances(companyId),
          window.api.unit.getAll(companyId),
          window.api.godown.getAll(companyId),
        ]);
        if (ledRes?.success) {
          const ledgers = (ledRes as { ledgers?: LedgerType[] }).ledgers ?? [];
          setAllLedgers(ledgers);
          // default Purchase ledger → "Goods Purchase"
          const gp = ledgers.find(
            (l) => l.name?.toLowerCase() === "goods purchase"
          );
          if (gp) setPurchaseLedger(gp);
        }
        if (itemRes?.success) setAllStockItems(itemRes.stockItems ?? []);
        if (balRes?.success) setStockBalances(balRes.balances ?? {});
        if (unitRes?.success) setAllUnits(unitRes.units ?? []);
        if (godRes?.success) setAllGodowns(godRes.godowns ?? []);
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [companyId]);

  // ── party selection ───────────────────────────────────────────────────
  const handlePartySelect = useCallback(
    async (led: LedgerType) => {
      setPartyLedger(led);
      setPartyPanelOpen(false);
      setPartySearch("");
      // current balance
      if (companyId && fyId && led.ledger_id != null) {
        try {
          const res = await window.api.voucher.getLedgerBalance(
            led.ledger_id,
            companyId,
            fyId
          );
          if (res?.success) setPartyBalance(res.balance ?? "");
        } catch {
          /* ignore balance errors */
        }
      }
      // open Party Details popup (prefilled from chosen ledger)
      setPartyDetailsOpen(true);
    },
    [companyId, fyId]
  );

  const handlePurchaseSelect = useCallback((led: LedgerType) => {
    setPurchaseLedger(led);
    setPurchasePanelOpen(false);
    setPurchaseSearch("");
  }, []);

  // ── stock-item selection ──────────────────────────────────────────────
  const stockItemsForPanel = useMemo(
    () =>
      allStockItems.map((it) => ({
        ...it,
        ledger_id: undefined,
      })),
    [allStockItems]
  );

  const handleItemSelect = useCallback(
    (item: StockItemType) => {
      const targetId = itemPanelRow;
      setItemPanelRow(null);
      setItemSearch("");
      if (targetId == null) return;
      const unit =
        allUnits.find((u) => u.unit_id === item.unit_id) ?? null;
      setRows((prev) => {
        const next = prev.map((r) =>
          r.id === targetId ? { ...r, stockItem: item, unit } : r
        );
        // ensure there is always one trailing blank row
        if (next.every((r) => r.stockItem)) next.push(blankRow());
        return next;
      });
    },
    [itemPanelRow, allUnits]
  );

  const updateRow = (id: number, patch: Partial<StockRow>) =>
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );

  const removeRow = (id: number) =>
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length ? next : [blankRow()];
    });

  // ── godown allocation popup save ──────────────────────────────────────
  const godownRow = rows.find((r) => r.id === godownRowId) ?? null;

  // ── totals ────────────────────────────────────────────────────────────
  const totalActual = rows.reduce(
    (s, r) => s + (Number(r.quantityRaw) || 0),
    0
  );
  const totalBilled = rows.reduce(
    (s, r) => s + (Number(r.billedQtyRaw || r.quantityRaw) || 0),
    0
  );
  const grandTotal = rows.reduce((s, r) => s + rowAmount(r), 0);

  const filledRows = rows.filter((r) => r.stockItem && rowAmount(r) > 0);

  // ── save ──────────────────────────────────────────────────────────────
  const quit = useCallback(() => navigate("/master/create"), [navigate]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!companyId || !fyId) {
      setError("No active company / financial year.");
      return;
    }
    if (!partyLedger) {
      setError("Party A/c name is required.");
      return;
    }
    if (!purchaseLedger) {
      setError("Purchase ledger is required.");
      return;
    }
    if (filledRows.length === 0) {
      setError("Add at least one stock item with quantity and rate.");
      return;
    }

    const stockEntries = filledRows.map((r) => {
      const qty = Number(r.billedQtyRaw || r.quantityRaw) || 0;
      const allocations = r.godownAllocations.filter((a) => a.godown_id != null);
      return {
        stock_item_id: r.stockItem!.item_id,
        item_name: r.stockItem!.name,
        godown_id: allocations.length === 1 ? allocations[0].godown_id : null,
        unit_id: r.unit?.unit_id ?? r.stockItem!.unit_id ?? null,
        quantity: qty,
        rate: Number(r.rateRaw) || 0,
        discount_amount: (() => {
          const gross = qty * (Number(r.rateRaw) || 0);
          const disc = Number(r.discPercentRaw) || 0;
          return (gross * disc) / 100;
        })(),
      };
    });

    const total = grandTotal;
    // balanced double-entry: Dr Purchase ledger, Cr Party
    const entries = [
      {
        ledger_id: purchaseLedger.ledger_id,
        ledger_name: purchaseLedger.name,
        type: "Dr",
        amount: total,
      },
      {
        ledger_id: partyLedger.ledger_id,
        ledger_name: partyLedger.name,
        type: "Cr",
        amount: total,
      },
    ];

    const placeOfSupply =
      partyDetails?.place_of_supply ?? partyDetails?.state ?? null;

    const payload = {
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Purchase",
      status: "Excise Opening Stock",
      date: openingDate,
      is_invoice: 1,
      is_inventory_voucher: 1,
      is_accounting_voucher: 1,
      supplier_invoice_no: supplierInvoiceNo || null,
      narration: narration || null,
      party_ledger_id: partyLedger.ledger_id,
      party_name: partyLedger.name,
      place_of_supply: placeOfSupply,
      stock_entries: stockEntries,
      entries,
      party_details: partyDetails
        ? {
            supplier_name: partyDetails.supplier_name,
            mailing_name: partyDetails.mailing_name,
            address: partyDetails.address,
            state: partyDetails.state,
            country: partyDetails.country,
          }
        : undefined,
      receipt_details: receiptDetails ?? undefined,
    };

    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await window.api.voucher.create(payload as any);
      if (res?.success) {
        setSuccess("Dealer Excise Opening Stock saved.");
        setTimeout(() => navigate("/master/create"), 400);
      } else {
        setError(res?.error || "Failed to save.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [
    companyId,
    fyId,
    partyLedger,
    purchaseLedger,
    filledRows,
    grandTotal,
    openingDate,
    supplierInvoiceNo,
    narration,
    partyDetails,
    receiptDetails,
    navigate,
  ]);

  // keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        partyPanelOpen ||
        purchasePanelOpen ||
        partyDetailsOpen ||
        itemPanelRow != null ||
        godownRowId != null ||
        receiptOpen
      )
        return;
      if (e.key === "Escape") {
        e.preventDefault();
        quit();
      }
      if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    handleSubmit,
    quit,
    partyPanelOpen,
    purchasePanelOpen,
    partyDetailsOpen,
    itemPanelRow,
    godownRowId,
    receiptOpen,
  ]);

  const actions = [
    { key: "F6", label: "Receipt Details", onClick: () => setReceiptOpen(true) },
    { key: "Alt+A", label: "Accept", onClick: handleSubmit },
    { key: "Esc", label: "Quit", onClick: quit },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none">
      <PageTitleBar
        title="Dealer Excise Opening Stock Creation"
        subtitle={`As on 1-Apr-${String(fyStartYear).slice(-2)}`}
      />

      {error && (
        <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />
      )}
      {success && (
        <AlertBanner
          type="success"
          message={success}
          onDismiss={() => setSuccess(null)}
        />
      )}

      <div className="flex-1 flex min-h-0">
        {/* main column */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* header fields + right read-only strip */}
          <div className="flex border-b border-zinc-300 shrink-0">
            <div className="flex-1 flex flex-col gap-1 px-3 py-2">
              {/* Supplier Invoice No. */}
              <div className="flex items-center gap-2">
                <span className="w-40 text-sm text-black shrink-0">
                  Supplier Invoice No.
                </span>
                <span className="text-sm text-black shrink-0">:</span>
                <input
                  type="text"
                  className="text-sm border border-zinc-400 px-1 py-0 outline-none focus:border-black w-44"
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                />
              </div>

              {/* Party A/c name */}
              <div className="flex items-center gap-2">
                <span className="w-40 text-sm text-black shrink-0">
                  Party A/c name
                </span>
                <span className="text-sm text-black shrink-0">:</span>
                <input
                  type="text"
                  readOnly
                  className="text-sm border border-zinc-400 px-1 py-0 outline-none focus:border-black w-56 cursor-pointer bg-white"
                  value={partyLedger?.name ?? ""}
                  placeholder="Select party…"
                  onFocus={() => {
                    setPartyPanelOpen(true);
                    setPartySearch("");
                  }}
                  onClick={() => {
                    setPartyPanelOpen(true);
                    setPartySearch("");
                  }}
                />
                {partyLedger && (
                  <button
                    type="button"
                    onClick={() => setPartyDetailsOpen(true)}
                    className="text-[10px] px-2 py-0.5 border border-zinc-400 text-black hover:bg-zinc-100"
                  >
                    Party Details
                  </button>
                )}
              </div>

              {/* Current balance */}
              {partyLedger && (
                <div className="flex items-center gap-2">
                  <span className="w-40 text-sm text-zinc-600 shrink-0">
                    Current balance
                  </span>
                  <span className="text-sm text-zinc-600 shrink-0">:</span>
                  <span className="text-sm font-semibold text-black tabular-nums">
                    {partyBalance || "—"}
                  </span>
                </div>
              )}

              {/* Purchase ledger */}
              <div className="flex items-center gap-2">
                <span className="w-40 text-sm text-black shrink-0">
                  Purchase ledger
                </span>
                <span className="text-sm text-black shrink-0">:</span>
                <input
                  type="text"
                  readOnly
                  className="text-sm border border-zinc-400 px-1 py-0 outline-none focus:border-black w-56 cursor-pointer bg-white"
                  value={purchaseLedger?.name ?? ""}
                  placeholder="Select ledger…"
                  onFocus={() => {
                    setPurchasePanelOpen(true);
                    setPurchaseSearch("");
                  }}
                  onClick={() => {
                    setPurchasePanelOpen(true);
                    setPurchaseSearch("");
                  }}
                />
              </div>
            </div>

            {/* right read-only context strip */}
            <div className="w-64 border-l border-zinc-300 px-3 py-2 flex flex-col gap-1 bg-zinc-50">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-600">GST Registration</span>
                <span className="text-black font-medium">
                  {partyDetails?.state ?? selectedCompany?.name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-600">Tax Unit</span>
                <span className="text-black font-medium">♦ Not Applicable</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-600">Status</span>
                <span className="text-black font-semibold">
                  Excise Opening Stock
                </span>
              </div>
            </div>
          </div>

          {/* separator */}
          <div className="border-b border-black shrink-0" />

          {/* item grid header — two-line like Purchase voucher */}
          <div className="border-b border-black shrink-0 bg-white">
            <div className="flex px-3 py-0.5">
              <div className="flex-1 text-sm font-semibold text-black">
                Name of Item
              </div>
              <div className="w-44 text-center text-sm font-semibold text-black">
                Quantity
              </div>
              <div className="w-20 text-right text-sm font-semibold text-black">
                Rate
              </div>
              <div className="w-12 text-center text-sm font-semibold text-black">
                per
              </div>
              <div className="w-16 text-right text-sm font-semibold text-black">
                Disc %
              </div>
              <div className="w-32 text-right text-sm font-semibold text-black">
                Amount
              </div>
            </div>
            <div className="flex px-3 py-0.5 border-t border-zinc-200">
              <div className="flex-1" />
              <div className="w-44 flex">
                <div className="flex-1 text-center text-xs text-zinc-600">
                  Actual
                </div>
                <div className="flex-1 text-center text-xs text-zinc-600">
                  Billed
                </div>
              </div>
              <div className="w-20" />
              <div className="w-12" />
              <div className="w-16" />
              <div className="w-32" />
            </div>
          </div>

          {/* item rows */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="flex items-center border-b border-zinc-100 min-h-[24px] group px-3 py-0"
              >
                <div className="flex-1 flex items-center gap-1">
                  <input
                    type="text"
                    readOnly
                    className="flex-1 text-sm bg-transparent outline-none px-1 border border-transparent focus:border-black cursor-pointer"
                    value={row.stockItem?.name ?? ""}
                    placeholder={idx === 0 ? "Select Item…" : ""}
                    onFocus={() => {
                      setItemPanelRow(row.id);
                      setItemSearch("");
                    }}
                    onClick={() => {
                      setItemPanelRow(row.id);
                      setItemSearch("");
                    }}
                  />
                  {row.stockItem && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setGodownRowId(row.id)}
                      className="text-[10px] px-1.5 py-0.5 border border-zinc-300 text-zinc-600 hover:text-black hover:border-black shrink-0"
                    >
                      Godown
                    </button>
                  )}
                  {rows.length > 1 && row.stockItem && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => removeRow(row.id)}
                      className="text-xs text-zinc-300 hover:text-black opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Quantity Actual | Billed */}
                <div className="w-44 flex">
                  <div className="flex-1 text-right pr-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full text-right text-sm bg-transparent outline-none px-1 border border-transparent focus:border-black"
                      value={row.quantityRaw}
                      disabled={!row.stockItem}
                      onChange={(e) =>
                        updateRow(row.id, {
                          quantityRaw: e.target.value,
                          billedQtyRaw:
                            row.billedQtyRaw === "" ||
                            row.billedQtyRaw === row.quantityRaw
                              ? e.target.value
                              : row.billedQtyRaw,
                        })
                      }
                    />
                  </div>
                  <div className="flex-1 text-right pr-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full text-right text-sm bg-transparent outline-none px-1 border border-transparent focus:border-black"
                      value={row.billedQtyRaw || row.quantityRaw}
                      disabled={!row.stockItem}
                      onChange={(e) =>
                        updateRow(row.id, { billedQtyRaw: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="w-20 text-right pr-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full text-right text-sm bg-transparent outline-none px-1 border border-transparent focus:border-black"
                    value={row.rateRaw}
                    disabled={!row.stockItem}
                    onChange={(e) =>
                      updateRow(row.id, { rateRaw: e.target.value })
                    }
                  />
                </div>

                <div className="w-12 text-center text-xs text-zinc-500">
                  {row.unit?.symbol ?? ""}
                </div>

                <div className="w-16 text-right pr-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full text-right text-sm bg-transparent outline-none px-1 border border-transparent focus:border-black"
                    value={row.discPercentRaw}
                    disabled={!row.stockItem}
                    onChange={(e) =>
                      updateRow(row.id, { discPercentRaw: e.target.value })
                    }
                  />
                </div>

                <div className="w-32 text-right text-sm font-semibold text-black select-none tabular-nums">
                  {rowAmount(row) > 0 ? inr(rowAmount(row)) : ""}
                </div>
              </div>
            ))}

            {/* filler rows */}
            {Array.from({ length: Math.max(0, 5 - rows.length) }).map((_, i) => (
              <div
                key={`f-${i}`}
                className="flex border-b border-zinc-50 min-h-[24px] px-3"
              />
            ))}
          </div>

          {/* totals row */}
          <div className="flex border-t border-black shrink-0 px-3 py-0.5 bg-white">
            <div className="flex-1 text-sm font-semibold text-black" />
            <div className="w-44 flex">
              <div className="flex-1 text-right pr-1 text-sm font-semibold text-black tabular-nums">
                {totalActual > 0 ? totalActual.toFixed(2) : ""}
              </div>
              <div className="flex-1 text-right pr-1 text-sm font-semibold text-black tabular-nums">
                {totalBilled > 0 ? totalBilled.toFixed(2) : ""}
              </div>
            </div>
            <div className="w-20" />
            <div className="w-12" />
            <div className="w-16" />
            <div className="w-32 text-right text-sm font-semibold text-black tabular-nums">
              {grandTotal > 0 ? inr(grandTotal) : ""}
            </div>
          </div>

          {/* narration */}
          <div className="border-t border-zinc-200 px-3 py-2 shrink-0 bg-white">
            <div className="flex items-start gap-2">
              <span className="text-sm text-black shrink-0 pt-0.5">
                Narration
              </span>
              <span className="text-sm text-black shrink-0 pt-0.5">:</span>
              <textarea
                className="flex-1 text-sm border border-zinc-400 px-1 py-0.5 outline-none focus:border-black resize-none h-12"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
              />
            </div>
          </div>
        </div>

        <RightActionPanel actions={actions} />
      </div>

      <MasterFormFooter
        onCancel={quit}
        onSubmit={handleSubmit}
        loading={loading}
        disabled={filledRows.length === 0}
      />

      {/* Party ledger list */}
      {partyPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <LedgerListPanel
            title="List of Ledger Accounts"
            items={allLedgers}
            searchTerm={partySearch}
            onSearchChange={setPartySearch}
            onSelect={(it) => handlePartySelect(it as LedgerType)}
            onClose={() => {
              setPartyPanelOpen(false);
              setPartySearch("");
            }}
            onCreateNew={() => navigate("/master/create/ledger")}
            createLabel="Create"
            height="h-screen"
          />
        </div>
      )}

      {/* Purchase ledger list */}
      {purchasePanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <LedgerListPanel
            title="List of Ledger Accounts"
            items={allLedgers}
            searchTerm={purchaseSearch}
            onSearchChange={setPurchaseSearch}
            onSelect={(it) => handlePurchaseSelect(it as LedgerType)}
            onClose={() => {
              setPurchasePanelOpen(false);
              setPurchaseSearch("");
            }}
            onCreateNew={() => navigate("/master/create/ledger")}
            createLabel="Create"
            height="h-screen"
          />
        </div>
      )}

      {/* Stock item list */}
      {itemPanelRow != null && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <LedgerListPanel
            title="List of Stock Items"
            items={stockItemsForPanel}
            searchTerm={itemSearch}
            onSearchChange={setItemSearch}
            onSelect={(it) => handleItemSelect(it as StockItemType)}
            onClose={() => {
              setItemPanelRow(null);
              setItemSearch("");
            }}
            onCreateNew={() => navigate("/master/create/stock-item")}
            createLabel="Create"
            height="h-screen"
            stockBalances={stockBalances}
            allUnits={allUnits}
          />
        </div>
      )}

      {/* Party Details popup */}
      {partyDetailsOpen && partyLedger && (
        <PartyDetailsPopup
          partyLedger={partyLedger}
          allLedgers={allLedgers}
          initialDetails={partyDetails}
          onClose={() => setPartyDetailsOpen(false)}
          onSave={(d) => {
            setPartyDetails(d);
            setPartyDetailsOpen(false);
          }}
          onCreateLedger={() => navigate("/master/create/ledger")}
        />
      )}

      {/* Receipt Details popup */}
      {receiptOpen && (
        <ReceiptDetailsPopup
          initialDetails={receiptDetails}
          onClose={() => setReceiptOpen(false)}
          onSave={(d) => {
            setReceiptDetails(d);
            setReceiptOpen(false);
          }}
        />
      )}

      {/* Godown allocation popup */}
      {godownRow && (
        <GodownAllocationPopup
          row={godownRow}
          godowns={allGodowns}
          onClose={() => setGodownRowId(null)}
          onSave={(allocs) => {
            updateRow(godownRow.id, { godownAllocations: allocs });
            setGodownRowId(null);
          }}
        />
      )}
    </div>
  );
}

// ── Godown (Item) Allocations popup ───────────────────────────────────────
function GodownAllocationPopup({
  row,
  godowns,
  onClose,
  onSave,
}: {
  row: StockRow;
  godowns: GodownType[];
  onClose: () => void;
  onSave: (allocs: GodownAllocation[]) => void;
}) {
  const defaultActual = row.quantityRaw || "";
  const defaultBilled = row.billedQtyRaw || row.quantityRaw || "";
  const defaultRate = row.rateRaw || "";

  const [allocs, setAllocs] = useState<GodownAllocation[]>(
    row.godownAllocations.length
      ? row.godownAllocations
      : [
          {
            godown_id: godowns[0]?.godown_id ?? null,
            godown_name: godowns[0]?.name ?? "",
            actualRaw: defaultActual,
            billedRaw: defaultBilled,
            rateRaw: defaultRate,
          },
        ]
  );

  const set = (idx: number, patch: Partial<GodownAllocation>) =>
    setAllocs((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, ...patch } : a))
    );

  const addRow = () =>
    setAllocs((prev) => [
      ...prev,
      {
        godown_id: null,
        godown_name: "",
        actualRaw: "",
        billedRaw: "",
        rateRaw: defaultRate,
      },
    ]);

  const removeRow = (idx: number) =>
    setAllocs((prev) => prev.filter((_, i) => i !== idx));

  const totalActual = allocs.reduce(
    (s, a) => s + (Number(a.actualRaw) || 0),
    0
  );
  const totalBilled = allocs.reduce(
    (s, a) => s + (Number(a.billedRaw) || 0),
    0
  );
  const totalAmount = allocs.reduce(
    (s, a) => s + (Number(a.billedRaw) || 0) * (Number(a.rateRaw) || 0),
    0
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        onSave(allocs);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocs]);

  const unitSymbol = row.unit?.symbol ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border border-black shadow-xl w-[760px] flex flex-col">
        <div className="bg-black text-white px-3 py-1 flex justify-between items-center select-none">
          <span className="text-sm font-bold">
            Item Allocations for {row.stockItem?.name ?? "Item"}
          </span>
          <button
            onClick={onClose}
            className="text-white hover:text-zinc-300 font-bold text-sm leading-none"
          >
            &times;
          </button>
        </div>

        {/* header */}
        <div className="border-b border-black bg-white">
          <div className="flex px-3 py-0.5">
            <div className="flex-1 text-sm font-semibold text-black">Godown</div>
            <div className="w-40 text-center text-sm font-semibold text-black">
              Quantity
            </div>
            <div className="w-24 text-right text-sm font-semibold text-black">
              Rate
            </div>
            <div className="w-10 text-center text-sm font-semibold text-black">
              per
            </div>
            <div className="w-28 text-right text-sm font-semibold text-black">
              Amount
            </div>
            <div className="w-6" />
          </div>
          <div className="flex px-3 py-0.5 border-t border-zinc-200">
            <div className="flex-1" />
            <div className="w-40 flex">
              <div className="flex-1 text-center text-xs text-zinc-600">
                Actual
              </div>
              <div className="flex-1 text-center text-xs text-zinc-600">
                Billed
              </div>
            </div>
            <div className="w-24" />
            <div className="w-10" />
            <div className="w-28" />
            <div className="w-6" />
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {allocs.map((a, idx) => {
            const amt = (Number(a.billedRaw) || 0) * (Number(a.rateRaw) || 0);
            return (
              <div
                key={idx}
                className="flex items-center border-b border-zinc-100 px-3 py-0.5"
              >
                <div className="flex-1 pr-2">
                  <select
                    className="w-full text-sm border border-zinc-400 px-1 py-0 outline-none focus:border-black bg-white"
                    value={a.godown_id ?? ""}
                    onChange={(e) => {
                      const gid = e.target.value ? Number(e.target.value) : null;
                      const g = godowns.find((x) => x.godown_id === gid);
                      set(idx, {
                        godown_id: gid,
                        godown_name: g?.name ?? "",
                      });
                    }}
                  >
                    <option value="">Select Godown</option>
                    {godowns.map((g) => (
                      <option key={g.godown_id} value={g.godown_id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-40 flex">
                  <div className="flex-1 text-right pr-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full text-right text-sm border border-transparent focus:border-black outline-none px-1"
                      value={a.actualRaw}
                      onChange={(e) =>
                        set(idx, {
                          actualRaw: e.target.value,
                          billedRaw:
                            a.billedRaw === "" || a.billedRaw === a.actualRaw
                              ? e.target.value
                              : a.billedRaw,
                        })
                      }
                    />
                  </div>
                  <div className="flex-1 text-right pr-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="w-full text-right text-sm border border-transparent focus:border-black outline-none px-1"
                      value={a.billedRaw || a.actualRaw}
                      onChange={(e) => set(idx, { billedRaw: e.target.value })}
                    />
                  </div>
                </div>
                <div className="w-24 text-right pr-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-full text-right text-sm border border-transparent focus:border-black outline-none px-1"
                    value={a.rateRaw}
                    onChange={(e) => set(idx, { rateRaw: e.target.value })}
                  />
                </div>
                <div className="w-10 text-center text-xs text-zinc-500">
                  {unitSymbol}
                </div>
                <div className="w-28 text-right text-sm font-semibold text-black tabular-nums">
                  {amt > 0 ? inr(amt) : ""}
                </div>
                <div className="w-6 text-center">
                  {allocs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-xs text-zinc-400 hover:text-black"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-3 py-1 border-b border-zinc-100">
          <button
            type="button"
            onClick={addRow}
            className="text-xs text-zinc-600 hover:text-black border border-zinc-300 px-2 py-0.5"
          >
            + Add Godown
          </button>
        </div>

        {/* totals */}
        <div className="flex border-t border-black px-3 py-0.5 bg-white">
          <div className="flex-1 text-xs text-zinc-700 font-semibold">Total</div>
          <div className="w-40 flex">
            <div className="flex-1 text-right pr-1 text-sm font-semibold text-black tabular-nums">
              {totalActual > 0 ? totalActual.toFixed(2) : ""}
            </div>
            <div className="flex-1 text-right pr-1 text-sm font-semibold text-black tabular-nums">
              {totalBilled > 0 ? totalBilled.toFixed(2) : ""}
            </div>
          </div>
          <div className="w-24" />
          <div className="w-10" />
          <div className="w-28 text-right text-sm font-semibold text-black tabular-nums">
            {totalAmount > 0 ? inr(totalAmount) : ""}
          </div>
          <div className="w-6" />
        </div>

        <div className="border-t border-black px-3 py-2 flex justify-between items-center bg-zinc-50">
          <span className="text-[10px] text-zinc-600">
            Alt+A: Accept &nbsp;&middot;&nbsp; Esc: Close
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1 border border-black text-black hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(allocs)}
              className="text-xs px-4 py-1 bg-black text-white hover:bg-zinc-800"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
