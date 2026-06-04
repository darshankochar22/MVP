// hooks/useVoucherRows.ts
// ─── All row arrays and their handlers (particulars, journal, double-entry, stock) ──

import { useState, useCallback, useMemo } from "react";
import type { LedgerType, StockItemType, UnitType } from "../../../types/api";
import type { ParticularRow, StockEntryRow, ActiveField } from "../types";

// ─── ID factory ───────────────────────────────────────────────────────────────

let idCounter = 0;
export const nextId = () => `row_${++idCounter}_${Date.now()}`;

// ─── Row factories ────────────────────────────────────────────────────────────

export const makeParticularRow = (type: "Dr" | "Cr" = "Dr"): ParticularRow => ({
  id: nextId(),
  type,
  ledger: null,
  ledgerBalance: "",
  amountRaw: "",
});

export const makeStockRow = (): StockEntryRow => ({
  id: nextId(),
  stockItem: null,
  godown: null,
  unit: null,
  quantityRaw: "",
  rateRaw: "",
  amountRaw: "",
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseVoucherRowsOptions {
  initialParticulars?: ParticularRow[];
  initialJournalRows?: ParticularRow[];
  initialContraDoubleRows?: ParticularRow[];
  initialReceiptDoubleRows?: ParticularRow[];
  initialPaymentDoubleRows?: ParticularRow[];
  initialStockEntries?: StockEntryRow[];
  initialAdditionalEntries?: ParticularRow[];
  initialContraEntryMode?: "single" | "double";
  initialReceiptEntryMode?: "single" | "double";
  initialJournalEntryMode?: "single" | "double";
  initialPaymentEntryMode?: "single" | "double";
  fetchLedgerBalance: (ledgerId: number) => Promise<string>;
  voucherType: string;
  allUnits: UnitType[];
}

export function useVoucherRows({
  initialParticulars,
  initialJournalRows,
  initialContraDoubleRows,
  initialReceiptDoubleRows,
  initialPaymentDoubleRows,
  initialStockEntries,
  initialAdditionalEntries = [],
  initialContraEntryMode = "double",
  initialReceiptEntryMode = "double",
  initialJournalEntryMode = "double",
  initialPaymentEntryMode = "double",
  fetchLedgerBalance,
  voucherType,
  allUnits,
}: UseVoucherRowsOptions) {

  // ── Account field ──────────────────────────────────────────────────────────
  const [accountLedger, setAccountLedger] = useState<LedgerType | null>(null);
  const [accountBalance, setAccountBalance] = useState<string>("");

  // ── Party + Sales/Purchase ─────────────────────────────────────────────────
  const [partyLedger, setPartyLedger] = useState<LedgerType | null>(null);
  const [partyBalance, setPartyBalance] = useState<string>("");
  const [salesPurchaseLedger, setSalesPurchaseLedger] = useState<LedgerType | null>(null);
  const [salesPurchaseBalance, setSalesPurchaseBalance] = useState<string>("");

  // ── Single-entry particulars ───────────────────────────────────────────────
  const [particulars, setParticulars] = useState<ParticularRow[]>(
    () => initialParticulars ?? [makeParticularRow("Cr")]
  );

  // ── Double-entry rows ──────────────────────────────────────────────────────
  const [contraEntryMode, setContraEntryMode] = useState<"single" | "double">(initialContraEntryMode);
  const [contraDoubleRows, setContraDoubleRows] = useState<ParticularRow[]>(
    () => initialContraDoubleRows ?? [makeParticularRow("Cr"), makeParticularRow("Dr")]
  );

  const [receiptEntryMode, setReceiptEntryMode] = useState<"single" | "double">(initialReceiptEntryMode);
  const [receiptDoubleRows, setReceiptDoubleRows] = useState<ParticularRow[]>(
    () => initialReceiptDoubleRows ?? [makeParticularRow("Cr"), makeParticularRow("Dr")]
  );

  const [paymentEntryMode, setPaymentEntryMode] = useState<"single" | "double">(initialPaymentEntryMode);
  const [paymentDoubleRows, setPaymentDoubleRows] = useState<ParticularRow[]>(
    () => initialPaymentDoubleRows ?? [makeParticularRow("Cr"), makeParticularRow("Dr")]
  );

  const [journalEntryMode, setJournalEntryMode] = useState<"single" | "double">(initialJournalEntryMode);
  const [journalRows, setJournalRows] = useState<ParticularRow[]>(
    () => initialJournalRows ?? [makeParticularRow("Cr"), makeParticularRow("Dr")]
  );

  // ── Inventory ──────────────────────────────────────────────────────────────
  const [stockEntries, setStockEntries] = useState<StockEntryRow[]>(
    () => initialStockEntries ?? [makeStockRow()]
  );
  const [additionalEntries, setAdditionalEntries] = useState<ParticularRow[]>(initialAdditionalEntries);

  // ── Active field / search ──────────────────────────────────────────────────
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [activeField, setActiveField] = useState<ActiveField | null>(null);

  // ─── Derived: particular type for single-entry layouts ──────────────────────

  const deriveParticularType = useCallback(
    (currentType: "Dr" | "Cr"): "Dr" | "Cr" => {
      if (voucherType === "Receipt") return "Cr";
      if (voucherType === "Payment") return "Dr";
      if (voucherType === "Contra") return "Dr";
      if (voucherType === "Journal" && journalEntryMode === "single") return "Dr";
      return currentType;
    },
    [voucherType, journalEntryMode]
  );

  // ─── Computed totals ───────────────────────────────────────────────────────

  const particularsTotal = useMemo(
    () => particulars.reduce((s, p) => s + (Number(p.amountRaw) || 0), 0),
    [particulars]
  );

  const debitTotal = useMemo(() => {
    if (voucherType === "Journal" && journalEntryMode === "double") {
      return journalRows.reduce((sum, r) => sum + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
    }
    if (voucherType === "Contra" && contraEntryMode === "double") {
      return contraDoubleRows.reduce((sum, r) => sum + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
    }
    if (voucherType === "Receipt" && receiptEntryMode === "double") {
      return receiptDoubleRows.reduce((sum, r) => sum + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
    }
    if (voucherType === "Payment" && paymentEntryMode === "double") {
      return paymentDoubleRows.reduce((sum, r) => sum + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
    }
    return particularsTotal;
  }, [voucherType, journalRows, journalEntryMode, contraDoubleRows, contraEntryMode, receiptDoubleRows, receiptEntryMode, paymentDoubleRows, paymentEntryMode, particularsTotal]);

  const creditTotal = useMemo(() => {
    if (voucherType === "Journal" && journalEntryMode === "double") {
      return journalRows.reduce((sum, r) => sum + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
    }
    if (voucherType === "Contra" && contraEntryMode === "double") {
      return contraDoubleRows.reduce((sum, r) => sum + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
    }
    if (voucherType === "Receipt" && receiptEntryMode === "double") {
      return receiptDoubleRows.reduce((sum, r) => sum + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
    }
    if (voucherType === "Payment" && paymentEntryMode === "double") {
      return paymentDoubleRows.reduce((sum, r) => sum + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
    }
    return particularsTotal;
  }, [voucherType, journalRows, journalEntryMode, contraDoubleRows, contraEntryMode, receiptDoubleRows, receiptEntryMode, paymentDoubleRows, paymentEntryMode, particularsTotal]);

  const totalAmount = useMemo(() => {
    if (voucherType === "Receipt") return receiptEntryMode === "double" ? debitTotal : particularsTotal;
    if (voucherType === "Payment") return paymentEntryMode === "double" ? debitTotal : particularsTotal;
    if (voucherType === "Contra") return contraEntryMode === "double" ? debitTotal : particularsTotal;
    if (voucherType === "Journal") return journalEntryMode === "single" ? particularsTotal : debitTotal;
    if (["Sales", "Purchase", "Credit Note", "Debit Note"].includes(voucherType)) {
      const stockSum = stockEntries.reduce((s, r) => s + (Number(r.amountRaw) || 0), 0);
      const adjSum = additionalEntries.reduce((s, r) => {
        const amt = Number(r.amountRaw) || 0;
        if (voucherType === "Sales") return r.type === "Cr" ? s + amt : s - amt;
        return r.type === "Dr" ? s + amt : s - amt;
      }, 0);
      return Math.max(0, stockSum + adjSum);
    }
    return 0;
  }, [voucherType, particularsTotal, debitTotal, contraEntryMode, receiptEntryMode, journalEntryMode, paymentEntryMode, stockEntries, additionalEntries]);

  // ─── Single-entry particular row handlers ─────────────────────────────────

  const handleAddParticularRow = useCallback(() => {
    setParticulars((prev) => [
      ...prev,
      makeParticularRow(
        voucherType === "Receipt" ? "Cr" : voucherType === "Payment" ? "Dr" : "Dr"
      ),
    ]);
  }, [voucherType]);

  const handleUpdateParticularRow = useCallback(
    async (id: string, updates: Partial<Omit<ParticularRow, "id">>) => {
      setParticulars((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const next = { ...p, ...updates };
          if (updates.ledger !== undefined) {
            next.type = deriveParticularType(p.type);
          }
          return next;
        })
      );
      if (updates.ledger?.ledger_id) {
        const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
        setParticulars((prev) =>
          prev.map((p) => (p.id !== id ? p : { ...p, ledgerBalance: bal }))
        );
      }
    },
    [deriveParticularType, fetchLedgerBalance]
  );

  const handleRemoveParticularRow = useCallback((id: string) => {
    setParticulars((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  }, []);

  // ─── Journal row handlers ──────────────────────────────────────────────────

  const handleAddJournalRow = useCallback(() => {
    setJournalRows((prev) => {
      const drSum = prev.reduce((s, r) => s + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
      const crSum = prev.reduce((s, r) => s + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
      const diff = drSum - crSum;
      const nextType: "Dr" | "Cr" =
        diff < -0.01 ? "Dr" : diff > 0.01 ? "Cr" : (prev[prev.length - 1]?.type === "Dr" ? "Cr" : "Dr");
      return [...prev, makeParticularRow(nextType)];
    });
  }, []);

  const handleUpdateJournalRow = useCallback(
    async (id: string, updates: Partial<Omit<ParticularRow, "id">>) => {
      setJournalRows((prev) => {
        const nextRows = prev.map((r) => (r.id !== id ? r : {
          ...r, ...updates,
          ...(updates.ledger !== undefined ? { ledgerBalance: "" } : {}),
        }));
        if (updates.ledger?.ledger_id) {
          const updatedRow = nextRows.find((r) => r.id === id);
          if (updatedRow && (!updatedRow.amountRaw || Number(updatedRow.amountRaw) === 0)) {
            const drTotal = nextRows.reduce((s, r) => s + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
            const crTotal = nextRows.reduce((s, r) => s + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
            const deficit = updatedRow.type === "Dr" ? crTotal - drTotal : drTotal - crTotal;
            if (Math.abs(deficit) > 0.01) {
              return nextRows.map((r) =>
                r.id === id ? { ...r, amountRaw: Math.abs(deficit).toFixed(2) } : r
              );
            }
          }
        }
        return nextRows;
      });
      if (updates.ledger?.ledger_id) {
        const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
        setJournalRows((prev) =>
          prev.map((r) => (r.id !== id ? r : { ...r, ledgerBalance: bal }))
        );
      }
    },
    [fetchLedgerBalance]
  );

  const handleRemoveJournalRow = useCallback((id: string) => {
    setJournalRows((prev) => (prev.length > 2 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  // ─── Contra double-entry row handlers ─────────────────────────────────────

  const handleAddContraDoubleRow = useCallback(() => {
    setContraDoubleRows((prev) => {
      const drSum = prev.reduce((s, r) => s + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
      const crSum = prev.reduce((s, r) => s + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
      const diff = drSum - crSum;
      const nextType: "Dr" | "Cr" =
        diff < -0.01 ? "Dr" : diff > 0.01 ? "Cr" : (prev[prev.length - 1]?.type === "Dr" ? "Cr" : "Dr");
      return [...prev, makeParticularRow(nextType)];
    });
  }, []);

  const handleUpdateContraDoubleRow = useCallback(
    async (id: string, updates: Partial<Omit<ParticularRow, "id">>) => {
      setContraDoubleRows((prev) => {
        const nextRows = prev.map((r) => (r.id !== id ? r : {
          ...r, ...updates,
          ...(updates.ledger !== undefined ? { ledgerBalance: "" } : {}),
        }));
        if (updates.ledger?.ledger_id) {
          const updatedRow = nextRows.find((r) => r.id === id);
          if (updatedRow && (!updatedRow.amountRaw || Number(updatedRow.amountRaw) === 0)) {
            const drTotal = nextRows.reduce((s, r) => s + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
            const crTotal = nextRows.reduce((s, r) => s + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
            const deficit = updatedRow.type === "Dr" ? crTotal - drTotal : drTotal - crTotal;
            if (Math.abs(deficit) > 0.01) {
              return nextRows.map((r) =>
                r.id === id ? { ...r, amountRaw: Math.abs(deficit).toFixed(2) } : r
              );
            }
          }
        }
        return nextRows;
      });
      if (updates.ledger?.ledger_id) {
        const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
        setContraDoubleRows((prev) =>
          prev.map((r) => (r.id !== id ? r : { ...r, ledgerBalance: bal }))
        );
      }
    },
    [fetchLedgerBalance]
  );

  const handleRemoveContraDoubleRow = useCallback((id: string) => {
    setContraDoubleRows((prev) => (prev.length > 2 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  // ─── Receipt double-entry row handlers ────────────────────────────────────

  const handleAddReceiptDoubleRow = useCallback(() => {
    setReceiptDoubleRows((prev) => {
      const drSum = prev.reduce((s, r) => s + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
      const crSum = prev.reduce((s, r) => s + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
      const diff = drSum - crSum;
      const nextType: "Dr" | "Cr" =
        diff < -0.01 ? "Dr" : diff > 0.01 ? "Cr" : (prev[prev.length - 1]?.type === "Dr" ? "Cr" : "Dr");
      return [...prev, makeParticularRow(nextType)];
    });
  }, []);

  const handleUpdateReceiptDoubleRow = useCallback(
    async (id: string, updates: Partial<Omit<ParticularRow, "id">>) => {
      setReceiptDoubleRows((prev) => {
        const nextRows = prev.map((r) => (r.id !== id ? r : {
          ...r, ...updates,
          ...(updates.ledger !== undefined ? { ledgerBalance: "" } : {}),
        }));
        if (updates.ledger?.ledger_id) {
          const updatedRow = nextRows.find((r) => r.id === id);
          if (updatedRow && (!updatedRow.amountRaw || Number(updatedRow.amountRaw) === 0)) {
            const drTotal = nextRows.reduce((s, r) => s + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
            const crTotal = nextRows.reduce((s, r) => s + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
            const deficit = updatedRow.type === "Dr" ? crTotal - drTotal : drTotal - crTotal;
            if (Math.abs(deficit) > 0.01) {
              return nextRows.map((r) =>
                r.id === id ? { ...r, amountRaw: Math.abs(deficit).toFixed(2) } : r
              );
            }
          }
        }
        return nextRows;
      });
      if (updates.ledger?.ledger_id) {
        const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
        setReceiptDoubleRows((prev) =>
          prev.map((r) => (r.id !== id ? r : { ...r, ledgerBalance: bal }))
        );
      }
    },
    [fetchLedgerBalance]
  );

  const handleRemoveReceiptDoubleRow = useCallback((id: string) => {
    setReceiptDoubleRows((prev) => (prev.length > 2 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  // ─── Payment double-entry row handlers ────────────────────────────────────

  const handleAddPaymentDoubleRow = useCallback(() => {
    setPaymentDoubleRows((prev) => {
      const drSum = prev.reduce((s, r) => s + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
      const crSum = prev.reduce((s, r) => s + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
      const diff = drSum - crSum;
      const nextType: "Dr" | "Cr" =
        diff < -0.01 ? "Dr" : diff > 0.01 ? "Cr" : (prev[prev.length - 1]?.type === "Dr" ? "Cr" : "Dr");
      return [...prev, makeParticularRow(nextType)];
    });
  }, []);

  const handleUpdatePaymentDoubleRow = useCallback(
    async (id: string, updates: Partial<Omit<ParticularRow, "id">>) => {
      setPaymentDoubleRows((prev) => {
        const nextRows = prev.map((r) => (r.id !== id ? r : {
          ...r, ...updates,
          ...(updates.ledger !== undefined ? { ledgerBalance: "" } : {}),
        }));
        if (updates.ledger?.ledger_id) {
          const updatedRow = nextRows.find((r) => r.id === id);
          if (updatedRow && (!updatedRow.amountRaw || Number(updatedRow.amountRaw) === 0)) {
            const drTotal = nextRows.reduce((s, r) => s + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
            const crTotal = nextRows.reduce((s, r) => s + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);
            const deficit = updatedRow.type === "Dr" ? crTotal - drTotal : drTotal - crTotal;
            if (Math.abs(deficit) > 0.01) {
              return nextRows.map((r) =>
                r.id === id ? { ...r, amountRaw: Math.abs(deficit).toFixed(2) } : r
              );
            }
          }
        }
        return nextRows;
      });
      if (updates.ledger?.ledger_id) {
        const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
        setPaymentDoubleRows((prev) =>
          prev.map((r) => (r.id !== id ? r : { ...r, ledgerBalance: bal }))
        );
      }
    },
    [fetchLedgerBalance]
  );

  const handleRemovePaymentDoubleRow = useCallback((id: string) => {
    setPaymentDoubleRows((prev) => (prev.length > 2 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  // ─── Stock entry handlers ─────────────────────────────────────────────────

  const handleAddStockRow = useCallback(() => {
    setStockEntries((prev) => [...prev, makeStockRow()]);
  }, []);

  const handleUpdateStockRow = useCallback(
    async (id: string, updates: Partial<Omit<StockEntryRow, "id">>) => {
      setStockEntries((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const updated = { ...r, ...updates };
          if (updates.quantityRaw !== undefined || updates.rateRaw !== undefined) {
            const qty = Number(updated.quantityRaw) || 0;
            const rate = Number(updated.rateRaw) || 0;
            updated.amountRaw = qty > 0 && rate > 0 ? (qty * rate).toFixed(2) : "";
          }
          return updated;
        })
      );
    },
    []
  );

  const handleRemoveStockRow = useCallback((id: string) => {
    setStockEntries((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  // ─── Additional entry handlers ────────────────────────────────────────────

  const handleAddAdditionalRow = useCallback(() => {
    setAdditionalEntries((prev) => [
      ...prev,
      makeParticularRow(voucherType === "Sales" ? "Cr" : "Dr"),
    ]);
  }, [voucherType]);

  const handleUpdateAdditionalRow = useCallback(
    async (id: string, updates: Partial<Omit<ParticularRow, "id">>) => {
      setAdditionalEntries((prev) =>
        prev.map((p) => (p.id !== id ? p : { ...p, ...updates }))
      );
      if (updates.ledger?.ledger_id) {
        const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
        setAdditionalEntries((prev) =>
          prev.map((p) => (p.id !== id ? p : { ...p, ledgerBalance: bal }))
        );
      }
    },
    [fetchLedgerBalance]
  );

  const handleRemoveAdditionalRow = useCallback((id: string) => {
    setAdditionalEntries((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ─── Active field / search panel ──────────────────────────────────────────

  const handleFieldFocus = useCallback((field: ActiveField) => {
    setActiveField(field);
    setLedgerSearchTerm("");
    setStockSearchTerm("");
  }, []);

  const handleFieldBlur = useCallback(() => {
    setActiveField(null);
  }, []);

  // ─── Universal ledger panel selection handler ─────────────────────────────

  const handleLedgerPanelSelect = useCallback(
    (item: any) => {
      if (!activeField) return;

      switch (activeField.type) {
        case "account":
          setAccountLedger(item as LedgerType);
          break;
        case "party":
          setPartyLedger(item as LedgerType);
          break;
        case "salesPurchase":
          setSalesPurchaseLedger(item as LedgerType);
          break;
        case "particular": {
          const ledger = item as LedgerType;
          if (voucherType === "Journal") {
            handleUpdateJournalRow(activeField.rowId, { ledger });
          } else if (voucherType === "Contra" && contraEntryMode === "double") {
            handleUpdateContraDoubleRow(activeField.rowId, { ledger });
          } else if (voucherType === "Receipt" && receiptEntryMode === "double") {
            handleUpdateReceiptDoubleRow(activeField.rowId, { ledger });
          } else if (voucherType === "Payment" && paymentEntryMode === "double") {
            handleUpdatePaymentDoubleRow(activeField.rowId, { ledger });
          } else {
            handleUpdateParticularRow(activeField.rowId, { ledger });
          }
          break;
        }
        case "additional":
          handleUpdateAdditionalRow(activeField.rowId, { ledger: item as LedgerType });
          break;
        case "stockItem": {
          const stockItem = item as StockItemType;
          const matchingUnit = allUnits.find((u) => u.unit_id === stockItem.unit_id) ?? null;
          handleUpdateStockRow(activeField.rowId, { stockItem, unit: matchingUnit });
          break;
        }
        default:
          break;
      }

      setActiveField(null);
      setLedgerSearchTerm("");
      setStockSearchTerm("");
    },
    [
      activeField, voucherType, contraEntryMode, receiptEntryMode, paymentEntryMode, allUnits,
      handleUpdateParticularRow, handleUpdateJournalRow,
      handleUpdateContraDoubleRow, handleUpdateReceiptDoubleRow, handleUpdatePaymentDoubleRow,
      handleUpdateAdditionalRow, handleUpdateStockRow,
    ]
  );

  // ─── Reset rows (called from full resetForm) ──────────────────────────────

  const resetRows = useCallback((currentVoucherType: string) => {
    const defaultParticular: "Dr" | "Cr" =
      currentVoucherType === "Receipt" ? "Cr"
      : currentVoucherType === "Payment" ? "Dr"
      : "Dr";
    setAccountLedger(null);
    setAccountBalance("");
    setPartyLedger(null);
    setPartyBalance("");
    setSalesPurchaseLedger(null);
    setSalesPurchaseBalance("");
    setParticulars([makeParticularRow(defaultParticular)]);
    setJournalRows([makeParticularRow("Cr"), makeParticularRow("Dr")]);
    setContraDoubleRows([makeParticularRow("Cr"), makeParticularRow("Dr")]);
    setReceiptDoubleRows([makeParticularRow("Cr"), makeParticularRow("Dr")]);
    setPaymentDoubleRows([makeParticularRow("Cr"), makeParticularRow("Dr")]);
    setStockEntries([makeStockRow()]);
    setAdditionalEntries([]);
    setActiveField(null);
    setLedgerSearchTerm("");
    setStockSearchTerm("");
    setContraEntryMode("double");
    setReceiptEntryMode("double");
    setJournalEntryMode("double");
    setPaymentEntryMode("double");
  }, []);

  return {
    // ── account
    accountLedger, setAccountLedger, accountBalance, setAccountBalance,
    // ── party
    partyLedger, setPartyLedger, partyBalance, setPartyBalance,
    salesPurchaseLedger, setSalesPurchaseLedger, salesPurchaseBalance, setSalesPurchaseBalance,
    // ── single-entry particulars
    particulars, setParticulars,
    handleAddParticularRow, handleUpdateParticularRow, handleRemoveParticularRow,
    // ── contra double
    contraEntryMode, setContraEntryMode,
    contraDoubleRows, setContraDoubleRows,
    handleAddContraDoubleRow, handleUpdateContraDoubleRow, handleRemoveContraDoubleRow,
    // ── receipt double
    receiptEntryMode, setReceiptEntryMode,
    receiptDoubleRows, setReceiptDoubleRows,
    handleAddReceiptDoubleRow, handleUpdateReceiptDoubleRow, handleRemoveReceiptDoubleRow,
    // ── payment double
    paymentEntryMode, setPaymentEntryMode,
    paymentDoubleRows, setPaymentDoubleRows,
    handleAddPaymentDoubleRow, handleUpdatePaymentDoubleRow, handleRemovePaymentDoubleRow,
    // ── journal
    journalEntryMode, setJournalEntryMode,
    journalRows, setJournalRows,
    handleAddJournalRow, handleUpdateJournalRow, handleRemoveJournalRow,
    // ── stock / inventory
    stockEntries, setStockEntries,
    handleAddStockRow, handleUpdateStockRow, handleRemoveStockRow,
    additionalEntries, setAdditionalEntries,
    handleAddAdditionalRow, handleUpdateAdditionalRow, handleRemoveAdditionalRow,
    // ── search / active field
    ledgerSearchTerm, setLedgerSearchTerm,
    stockSearchTerm, setStockSearchTerm,
    activeField, setActiveField,
    handleFieldFocus, handleFieldBlur, handleLedgerPanelSelect,
    // ── totals
    particularsTotal, debitTotal, creditTotal, totalAmount,
    // ── reset
    resetRows,
  };
}
