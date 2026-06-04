// hooks/useVoucherForm.ts
// ─── Barrel hook: assembles all sub-hooks into one unified API ────────────────
//
// External API is IDENTICAL to the original monolithic version.
// All consumers (Vouchers.tsx, popups, etc.) import from this file unchanged.

import { useCallback, useEffect, useRef } from "react";
import { useCompany } from "../../../context/CompanyContext";
import { loadFormState, saveFormState, clearFormState } from "../../../utils/formPersistence";

import { useVoucherMeta } from "./useVoucherMeta";
import { useVoucherLedgers } from "./useVoucherLedgers";
import { useVoucherRows as useVoucherRowsInternal } from "./useVoucherRowsNew";

// Re-export types so any file that previously imported from this hook still works
export type { ParticularRow, StockEntryRow, ActiveField, ActiveAllocation } from "../types";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoucherForm() {
  const { selectedCompany, activeFY } = useCompany();
  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;
  const persistKey = companyId ? `voucherForm_${companyId}` : null;

  // ── Restore persisted state (once on mount) ────────────────────────────────
  const saved = persistKey ? (loadFormState<any>(persistKey) ?? {}) : {};

  // ── Sub-hooks ──────────────────────────────────────────────────────────────

  const meta = useVoucherMeta({
    initialVoucherType: saved.voucherType ?? "Receipt",
    initialNarration: saved.narration ?? "",
    initialReferenceNumber: saved.referenceNumber ?? "",
    initialPlaceOfSupply: saved.placeOfSupply ?? "Select",
    initialPartyBillReferences: saved.partyBillReferences ?? [],
    initialBankDetails: saved.bankDetails ?? null,
  });

  const ledgers = useVoucherLedgers({ companyId, fyId });

  const rows = useVoucherRowsInternal({
    initialParticulars: saved.particulars?.length ? saved.particulars : undefined,
    initialJournalRows: saved.journalRows?.length ? saved.journalRows : undefined,
    initialContraDoubleRows: saved.contraDoubleRows?.length ? saved.contraDoubleRows : undefined,
    initialReceiptDoubleRows: saved.receiptDoubleRows?.length ? saved.receiptDoubleRows : undefined,
    initialPaymentDoubleRows: saved.paymentDoubleRows?.length ? saved.paymentDoubleRows : undefined,
    initialStockEntries: saved.stockEntries?.length ? saved.stockEntries : undefined,
    initialAdditionalEntries: saved.additionalEntries ?? [],
    initialContraEntryMode: saved.contraEntryMode ?? "double",
    initialReceiptEntryMode: saved.receiptEntryMode ?? "double",
    initialJournalEntryMode: saved.journalEntryMode ?? "double",
    initialPaymentEntryMode: saved.paymentEntryMode ?? "double",
    fetchLedgerBalance: ledgers.fetchLedgerBalance,
    voucherType: meta.voucherType,
    allUnits: ledgers.allUnits,
  });

  // ── Track whether the first render has passed so auto-save doesn't overwrite ─
  const hasRestored = useRef(false);

  // ── Load master data and next voucher number on mount ─────────────────────

  const fetchNextNumber = useCallback(async () => {
    await ledgers.fetchNextVoucherNumber(
      meta.voucherType,
      meta.setVoucherNumber,
      meta.setVoucherNumberLoading
    );
  }, [ledgers.fetchNextVoucherNumber, meta.voucherType, meta.setVoucherNumber, meta.setVoucherNumberLoading]);

  useEffect(() => {
    ledgers.fetchContextData();
    fetchNextNumber();
  }, [ledgers.fetchContextData, fetchNextNumber]);

  // ── Ledger balance sync ────────────────────────────────────────────────────

  useEffect(() => {
    if (rows.accountLedger?.ledger_id) {
      ledgers.fetchLedgerBalance(rows.accountLedger.ledger_id).then(rows.setAccountBalance);
    } else {
      rows.setAccountBalance("");
    }
  }, [rows.accountLedger, ledgers.fetchLedgerBalance]);

  useEffect(() => {
    if (rows.partyLedger?.ledger_id) {
      ledgers.fetchLedgerBalance(rows.partyLedger.ledger_id).then(rows.setPartyBalance);
    } else {
      rows.setPartyBalance("");
    }
  }, [rows.partyLedger, ledgers.fetchLedgerBalance]);

  useEffect(() => {
    if (rows.salesPurchaseLedger?.ledger_id) {
      ledgers.fetchLedgerBalance(rows.salesPurchaseLedger.ledger_id).then(rows.setSalesPurchaseBalance);
    } else {
      rows.setSalesPurchaseBalance("");
    }
  }, [rows.salesPurchaseLedger, ledgers.fetchLedgerBalance]);

  // ── Persistence snapshot ───────────────────────────────────────────────────

  const getSnapshot = useCallback(
    () => ({
      voucherType: meta.voucherType,
      narration: meta.narration,
      accountLedger: rows.accountLedger,
      particulars: rows.particulars,
      journalRows: rows.journalRows,
      journalEntryMode: rows.journalEntryMode,
      contraEntryMode: rows.contraEntryMode,
      contraDoubleRows: rows.contraDoubleRows,
      receiptEntryMode: rows.receiptEntryMode,
      receiptDoubleRows: rows.receiptDoubleRows,
      paymentEntryMode: rows.paymentEntryMode,
      paymentDoubleRows: rows.paymentDoubleRows,
      partyLedger: rows.partyLedger,
      salesPurchaseLedger: rows.salesPurchaseLedger,
      stockEntries: rows.stockEntries,
      additionalEntries: rows.additionalEntries,
      referenceNumber: meta.referenceNumber,
      placeOfSupply: meta.placeOfSupply,
      partyBillReferences: meta.partyBillReferences,
      bankDetails: meta.bankDetails,
      supplierInvoiceNo: meta.supplierInvoiceNo,
      supplierInvoiceDate: meta.supplierInvoiceDate,
      receiptDetails: meta.receiptDetails,
      partyDetails: meta.partyDetails,
      dispatchDetails: meta.dispatchDetails,
      creditNoteDetails: meta.creditNoteDetails,
      debitNoteDetails: meta.debitNoteDetails,
    }),
    [meta, rows]
  );

  // Auto-save — skip the very first render (restoration just happened)
  useEffect(() => {
    if (!persistKey) return;
    if (!hasRestored.current) { hasRestored.current = true; return; }
    saveFormState(persistKey, getSnapshot());
  }, [persistKey, getSnapshot]);

  // ── Reset on voucher type change ───────────────────────────────────────────

  const resetFormRef = useRef<() => void>(() => {});
  const prevVoucherType = useRef(meta.voucherType);
  useEffect(() => {
    if (prevVoucherType.current !== meta.voucherType) {
      prevVoucherType.current = meta.voucherType;
      resetFormRef.current?.();
    }
  }, [meta.voucherType]);

  // ── Validate ───────────────────────────────────────────────────────────────

  const validate = useCallback((): string | null => {
    if (!companyId) return "No company selected.";
    if (!fyId) return "No active financial year.";

    if (meta.voucherType === "Receipt") {
      if (rows.receiptEntryMode === "single") {
        if (!rows.accountLedger) return "Account (cash/bank ledger) is required.";
        const filled = rows.particulars.filter((p) => p.ledger && Number(p.amountRaw) >= 0);
        if (filled.length < 1) return "At least one Particulars entry with an amount is required.";
      } else {
        const filled = rows.receiptDoubleRows.filter((r) => r.ledger && Number(r.amountRaw) >= 0);
        if (filled.length < 2) return "At least two valid entries are required.";
        if (Math.abs(rows.debitTotal - rows.creditTotal) > 0.01)
          return `Debit (${rows.debitTotal.toFixed(2)}) and Credit (${rows.creditTotal.toFixed(2)}) totals must balance.`;
      }
    }

    if (meta.voucherType === "Payment") {
      if (rows.paymentEntryMode === "single") {
        if (!rows.accountLedger) return "Account (cash/bank ledger) is required.";
        const filled = rows.particulars.filter((p) => p.ledger && Number(p.amountRaw) > 0);
        if (filled.length < 1) return "At least one Particulars entry with an amount is required.";
        if (rows.particularsTotal <= 0) return "Total amount must be greater than zero.";
      } else {
        const filled = rows.paymentDoubleRows.filter((r) => r.ledger && Number(r.amountRaw) > 0);
        if (filled.length < 2) return "At least two valid entries are required.";
        if (Math.abs(rows.debitTotal - rows.creditTotal) > 0.01)
          return `Debit (${rows.debitTotal.toFixed(2)}) and Credit (${rows.creditTotal.toFixed(2)}) totals must balance.`;
        if (rows.debitTotal <= 0) return "Amount must be greater than zero.";
      }
    }

    if (meta.voucherType === "Contra") {
      if (rows.contraEntryMode === "single") {
        if (!rows.accountLedger) return "Account (cash/bank ledger) is required.";
        if (!ledgers.checkIsCashOrBank(rows.accountLedger)) return "Contra Account must be a Cash or Bank ledger.";
        const filled = rows.particulars.filter((p) => p.ledger && Number(p.amountRaw) >= 0);
        if (filled.length < 1) return "At least one Particulars entry with an amount is required.";
        for (const row of filled) {
          if (!ledgers.checkIsCashOrBank(row.ledger)) return "Contra vouchers may only use Cash/Bank ledgers on both sides.";
        }
      } else {
        const filled = rows.contraDoubleRows.filter((r) => r.ledger && Number(r.amountRaw) >= 0);
        if (filled.length < 2) return "At least two valid entries are required.";
        for (const row of filled) {
          if (!ledgers.checkIsCashOrBank(row.ledger)) return "Contra vouchers may only use Cash/Bank ledgers.";
        }
        if (Math.abs(rows.debitTotal - rows.creditTotal) > 0.01)
          return `Debit (${rows.debitTotal.toFixed(2)}) and Credit (${rows.creditTotal.toFixed(2)}) totals must balance.`;
      }
    }

    if (meta.voucherType === "Journal") {
      if (rows.journalEntryMode === "single") {
        if (!rows.accountLedger) return "Account ledger is required.";
        const filled = rows.particulars.filter((p) => p.ledger && Number(p.amountRaw) > 0);
        if (filled.length < 1) return "At least one Particulars entry with an amount is required.";
        if (rows.particularsTotal <= 0) return "Total amount must be greater than zero.";
      } else {
        const filled = rows.journalRows.filter((r) => r.ledger && Number(r.amountRaw) > 0);
        if (filled.length < 2) return "At least two valid Journal entries are required.";
        for (const row of filled) {
          if (ledgers.checkIsCashOrBank(row.ledger)) return "Journal vouchers cannot use Cash or Bank ledgers.";
        }
        if (Math.abs(rows.debitTotal - rows.creditTotal) > 0.01)
          return `Debit (${rows.debitTotal.toFixed(2)}) and Credit (${rows.creditTotal.toFixed(2)}) totals must balance.`;
        if (rows.debitTotal <= 0) return "Journal amount must be greater than zero.";
      }
    }

    if (["Sales", "Purchase", "Credit Note", "Debit Note"].includes(meta.voucherType)) {
      if (!rows.partyLedger) return "Party A/c Name is required.";
      if (!rows.salesPurchaseLedger) {
        const baseLabel = meta.voucherType === "Credit Note" ? "Sales" : meta.voucherType === "Debit Note" ? "Purchase" : meta.voucherType;
        return `${baseLabel} Ledger is required.`;
      }
      if (rows.partyLedger.ledger_id === rows.salesPurchaseLedger.ledger_id)
        return `Party and ${meta.voucherType} ledger cannot be the same account.`;
      const filledItems = rows.stockEntries.filter(
        (r) => r.stockItem && Number(r.quantityRaw) > 0 && Number(r.rateRaw) > 0
      );
      if (filledItems.length === 0) return "At least one Stock Item with quantity and rate is required.";
      if (rows.totalAmount <= 0) return "Total amount must be greater than zero.";
    }

    return null;
  }, [companyId, fyId, meta, rows, ledgers.checkIsCashOrBank]);

  // ── handleSubmit ───────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const validationError = validate();
    if (validationError) { meta.setError(validationError); return; }

    meta.setIsSubmitting(true);
    meta.setError(null);
    meta.setSuccess(null);

    try {
      let entries: any[] = [];
      let stock_entries: any[] = [];

      // ── Build accounting entries ─────────────────────────────────────────

      if (meta.voucherType === "Receipt") {
        if (rows.receiptEntryMode === "single") {
          entries.push({ ledger_id: rows.accountLedger!.ledger_id, ledger_name: rows.accountLedger!.name, type: "Dr", amount: rows.particularsTotal });
          entries.push(...rows.particulars.filter((p) => p.ledger && Number(p.amountRaw) > 0).map((p) => ({ ledger_id: p.ledger!.ledger_id, ledger_name: p.ledger!.name, type: p.type, amount: Number(p.amountRaw), currency: "INR", cost_centres: p.costCentres })));
        } else {
          entries = rows.receiptDoubleRows.filter((r) => r.ledger && Number(r.amountRaw) > 0).map((r) => ({ ledger_id: r.ledger!.ledger_id, ledger_name: r.ledger!.name, type: r.type, amount: Number(r.amountRaw), currency: "INR", cost_centres: r.costCentres }));
        }
      } else if (meta.voucherType === "Payment") {
        if (rows.paymentEntryMode === "single") {
          entries.push({ ledger_id: rows.accountLedger!.ledger_id, ledger_name: rows.accountLedger!.name, type: "Cr", amount: rows.particularsTotal });
          entries.push(...rows.particulars.filter((p) => p.ledger && Number(p.amountRaw) > 0).map((p) => ({ ledger_id: p.ledger!.ledger_id, ledger_name: p.ledger!.name, type: p.type, amount: Number(p.amountRaw), currency: "INR", cost_centres: p.costCentres })));
        } else {
          entries = rows.paymentDoubleRows.filter((r) => r.ledger && Number(r.amountRaw) > 0).map((r) => ({ ledger_id: r.ledger!.ledger_id, ledger_name: r.ledger!.name, type: r.type, amount: Number(r.amountRaw), currency: "INR", cost_centres: r.costCentres }));
        }
      } else if (meta.voucherType === "Contra") {
        if (rows.contraEntryMode === "single") {
          entries.push({ ledger_id: rows.accountLedger!.ledger_id, ledger_name: rows.accountLedger!.name, type: "Cr", amount: rows.particularsTotal });
          entries.push(...rows.particulars.filter((p) => p.ledger && Number(p.amountRaw) > 0).map((p) => ({ ledger_id: p.ledger!.ledger_id, ledger_name: p.ledger!.name, type: p.type, amount: Number(p.amountRaw), currency: "INR", cost_centres: p.costCentres })));
        } else {
          entries = rows.contraDoubleRows.filter((r) => r.ledger && Number(r.amountRaw) > 0).map((r) => ({ ledger_id: r.ledger!.ledger_id, ledger_name: r.ledger!.name, type: r.type, amount: Number(r.amountRaw), currency: "INR", cost_centres: r.costCentres }));
        }
      } else if (meta.voucherType === "Journal") {
        if (rows.journalEntryMode === "single") {
          entries.push({ ledger_id: rows.accountLedger!.ledger_id, ledger_name: rows.accountLedger!.name, type: "Cr", amount: rows.particularsTotal });
          entries.push(...rows.particulars.filter((p) => p.ledger && Number(p.amountRaw) > 0).map((p) => ({ ledger_id: p.ledger!.ledger_id, ledger_name: p.ledger!.name, type: p.type, amount: Number(p.amountRaw), currency: "INR", cost_centres: p.costCentres })));
        } else {
          entries = rows.journalRows.filter((r) => r.ledger && Number(r.amountRaw) > 0).map((r) => ({ ledger_id: r.ledger!.ledger_id, ledger_name: r.ledger!.name, type: r.type, amount: Number(r.amountRaw), currency: "INR", cost_centres: r.costCentres }));
        }
      } else if (["Sales", "Purchase", "Credit Note", "Debit Note"].includes(meta.voucherType)) {
        const filledItems = rows.stockEntries.filter((r) => r.stockItem && Number(r.quantityRaw) > 0 && Number(r.rateRaw) > 0);
        const stockSubtotal = filledItems.reduce((s, r) => s + (Number(r.amountRaw) || 0), 0);
        stock_entries = filledItems.map((r) => ({ stock_item_id: r.stockItem!.item_id ?? null, item_name: r.stockItem!.name, godown_id: r.godown?.godown_id ?? null, unit_id: r.unit?.unit_id ?? null, quantity: Number(r.quantityRaw), rate: Number(r.rateRaw), amount: Number(r.amountRaw) }));
        const isPurchaseLike = meta.voucherType === "Purchase";
        const partyType: "Dr" | "Cr" = isPurchaseLike ? "Cr" : "Dr";
        const spType: "Dr" | "Cr" = isPurchaseLike ? "Dr" : "Cr";
        entries = [
          { ledger_id: rows.partyLedger!.ledger_id, ledger_name: rows.partyLedger!.name, type: partyType, amount: rows.totalAmount, currency: "INR" },
          { ledger_id: rows.salesPurchaseLedger!.ledger_id, ledger_name: rows.salesPurchaseLedger!.name, type: spType, amount: stockSubtotal, currency: "INR" },
          ...(meta.voucherType === "Sales" || meta.voucherType === "Purchase"
            ? rows.additionalEntries.filter((p) => p.ledger && Number(p.amountRaw) > 0).map((p) => ({ ledger_id: p.ledger!.ledger_id, ledger_name: p.ledger!.name, type: p.type, amount: Number(p.amountRaw), currency: "INR", cost_centres: p.costCentres }))
            : []),
        ];
      }

      // ── Collect bill references ──────────────────────────────────────────
      let finalBillReferences: any[] = [];
      if (meta.voucherType === "Receipt") {
        finalBillReferences = rows.receiptEntryMode === "single"
          ? rows.particulars.filter((p) => p.ledger && p.billReferences?.length).flatMap((p) => p.billReferences!.map((b) => ({ ...b, ledger_id: p.ledger!.ledger_id })))
          : rows.receiptDoubleRows.filter((r) => r.ledger && r.billReferences?.length).flatMap((r) => r.billReferences!.map((b) => ({ ...b, ledger_id: r.ledger!.ledger_id })));
      } else if (meta.voucherType === "Payment") {
        finalBillReferences = rows.paymentEntryMode === "single"
          ? rows.particulars.filter((p) => p.ledger && p.billReferences?.length).flatMap((p) => p.billReferences!.map((b) => ({ ...b, ledger_id: p.ledger!.ledger_id })))
          : rows.paymentDoubleRows.filter((r) => r.ledger && r.billReferences?.length).flatMap((r) => r.billReferences!.map((b) => ({ ...b, ledger_id: r.ledger!.ledger_id })));
      } else if (meta.voucherType === "Contra") {
        finalBillReferences = rows.contraEntryMode === "single"
          ? rows.particulars.filter((p) => p.ledger && p.billReferences?.length).flatMap((p) => p.billReferences!.map((b) => ({ ...b, ledger_id: p.ledger!.ledger_id })))
          : rows.contraDoubleRows.filter((r) => r.ledger && r.billReferences?.length).flatMap((r) => r.billReferences!.map((b) => ({ ...b, ledger_id: r.ledger!.ledger_id })));
      } else if (meta.voucherType === "Journal") {
        finalBillReferences = rows.journalRows.filter((r) => r.ledger && r.billReferences?.length).flatMap((r) => r.billReferences!.map((b) => ({ ...b, ledger_id: r.ledger!.ledger_id })));
      } else if (["Sales", "Purchase", "Credit Note", "Debit Note"].includes(meta.voucherType)) {
        if (rows.partyLedger && meta.partyBillReferences.length > 0) {
          finalBillReferences = meta.partyBillReferences.map((b) => ({ ...b, ledger_id: rows.partyLedger!.ledger_id }));
        }
        finalBillReferences = [...finalBillReferences, ...rows.additionalEntries.filter((p) => p.ledger && p.billReferences?.length).flatMap((p) => p.billReferences!.map((b) => ({ ...b, ledger_id: p.ledger!.ledger_id })))];
      }

      // ── Final payload ────────────────────────────────────────────────────
      const payload: any = {
        company_id: companyId!,
        fy_id: fyId!,
        voucher_type: meta.voucherType,
        date: meta.date,
        status: meta.status,
        supplier_invoice_no: meta.supplierInvoiceNo || null,
        supplier_invoice_date: meta.supplierInvoiceDate || null,
        reference_number: meta.referenceNumber || null,
        reference_date: meta.referenceDate || null,
        place_of_supply: meta.placeOfSupply !== "Select" ? meta.placeOfSupply : null,
        narration: meta.narration || null,
        party_ledger_id: ["Sales", "Purchase", "Credit Note", "Debit Note"].includes(meta.voucherType) ? rows.partyLedger?.ledger_id ?? null : null,
        party_name: ["Sales", "Purchase", "Credit Note", "Debit Note"].includes(meta.voucherType) ? rows.partyLedger?.name ?? null : null,
        is_accounting_voucher: 1,
        is_invoice: ["Sales", "Purchase", "Credit Note", "Debit Note"].includes(meta.voucherType) ? 1 : 0,
        is_inventory_voucher: ["Sales", "Purchase", "Credit Note", "Debit Note"].includes(meta.voucherType) ? 1 : 0,
        is_post_dated: meta.status === "Post-Dated" ? 1 : 0,
        entries,
        stock_entries,
        bill_references: finalBillReferences.length > 0 ? finalBillReferences : undefined,
        bank_details: meta.bankDetails || undefined,
        cash_denominations: meta.cashDenominations || undefined,
        receipt_details: meta.receiptDetails || undefined,
        party_details: meta.partyDetails || undefined,
        dispatch_details: meta.dispatchDetails || undefined,
        credit_note_details: meta.creditNoteDetails || undefined,
        debit_note_details: meta.debitNoteDetails || undefined,
      };

      const res = await window.api.voucher.create(payload);
      if (res.success) {
        const savedNumber = meta.voucherNumber;
        resetForm();
        meta.setSuccess(`Voucher No. ${savedNumber} saved successfully.`);
        ledgers.fetchContextData();
      } else {
        meta.setError(res.error || "Failed to save voucher.");
      }
    } catch (e: any) {
      meta.setError(e?.message || "Unexpected error.");
    } finally {
      meta.setIsSubmitting(false);
    }
  }, [validate, companyId, fyId, meta, rows, ledgers.fetchContextData]);

  // ── resetForm ──────────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    if (persistKey) clearFormState(persistKey);
    hasRestored.current = false;
    meta.resetMeta();
    rows.resetRows(meta.voucherType);
    fetchNextNumber();
  }, [persistKey, meta.resetMeta, rows.resetRows, meta.voucherType, fetchNextNumber]);

  resetFormRef.current = resetForm;

  // ── Public API — IDENTICAL to original useVoucherForm ─────────────────────

  return {
    // ── Voucher meta
    voucherType: meta.voucherType,
    setVoucherType: meta.setVoucherType,
    voucherNumber: meta.voucherNumber,
    voucherNumberLoading: meta.voucherNumberLoading,
    date: meta.date,
    setDate: meta.setDate,
    dateDisplay: meta.dateDisplay,
    status: meta.status,
    setStatus: meta.setStatus,
    supplierInvoiceNo: meta.supplierInvoiceNo,
    setSupplierInvoiceNo: meta.setSupplierInvoiceNo,
    supplierInvoiceDate: meta.supplierInvoiceDate,
    setSupplierInvoiceDate: meta.setSupplierInvoiceDate,
    narration: meta.narration,
    setNarration: meta.setNarration,

    // ── Computed totals
    totalAmount: rows.totalAmount,
    debitTotal: rows.debitTotal,
    creditTotal: rows.creditTotal,
    particularsTotal: rows.particularsTotal,

    // ── Submission
    isSubmitting: meta.isSubmitting,
    error: meta.error,
    setError: meta.setError,
    success: meta.success,
    setSuccess: meta.setSuccess,
    handleSubmit,
    resetForm,

    // ── Advanced allocations
    activeAllocation: meta.activeAllocation,
    setActiveAllocation: meta.setActiveAllocation,
    partyBillReferences: meta.partyBillReferences,
    setPartyBillReferences: meta.setPartyBillReferences,
    bankDetails: meta.bankDetails,
    setBankDetails: meta.setBankDetails,
    cashDenominations: meta.cashDenominations,
    setCashDenominations: meta.setCashDenominations,
    receiptDetails: meta.receiptDetails,
    setReceiptDetails: meta.setReceiptDetails,
    partyDetails: meta.partyDetails,
    setPartyDetails: meta.setPartyDetails,
    dispatchDetails: meta.dispatchDetails,
    setDispatchDetails: meta.setDispatchDetails,
    creditNoteDetails: meta.creditNoteDetails,
    setCreditNoteDetails: meta.setCreditNoteDetails,
    debitNoteDetails: meta.debitNoteDetails,
    setDebitNoteDetails: meta.setDebitNoteDetails,

    // ── Reference / invoice
    referenceNumber: meta.referenceNumber,
    setReferenceNumber: meta.setReferenceNumber,
    referenceDate: meta.referenceDate,
    setReferenceDate: meta.setReferenceDate,
    placeOfSupply: meta.placeOfSupply,
    setPlaceOfSupply: meta.setPlaceOfSupply,

    // ── Master data
    allLedgers: ledgers.allLedgers,
    allStockItems: ledgers.allStockItems,
    allGodowns: ledgers.allGodowns,
    allUnits: ledgers.allUnits,
    ledgersLoading: ledgers.ledgersLoading,
    fetchContextData: ledgers.fetchContextData,

    // ── Search / panel
    ledgerSearchTerm: rows.ledgerSearchTerm,
    setLedgerSearchTerm: rows.setLedgerSearchTerm,
    stockSearchTerm: rows.stockSearchTerm,
    setStockSearchTerm: rows.setStockSearchTerm,
    activeField: rows.activeField,
    handleFieldFocus: rows.handleFieldFocus,
    handleFieldBlur: rows.handleFieldBlur,
    handleLedgerPanelSelect: rows.handleLedgerPanelSelect,

    // ── Layout 1 — single-entry
    accountLedger: rows.accountLedger,
    accountBalance: rows.accountBalance,
    particulars: rows.particulars,
    setParticulars: rows.setParticulars,
    handleUpdateParticularRow: rows.handleUpdateParticularRow,
    handleAddParticularRow: rows.handleAddParticularRow,
    handleRemoveParticularRow: rows.handleRemoveParticularRow,

    // ── Layout 1b — Contra double-entry
    contraEntryMode: rows.contraEntryMode,
    setContraEntryMode: rows.setContraEntryMode,
    contraDoubleRows: rows.contraDoubleRows,
    setContraDoubleRows: rows.setContraDoubleRows,
    handleUpdateContraDoubleRow: rows.handleUpdateContraDoubleRow,
    handleAddContraDoubleRow: rows.handleAddContraDoubleRow,
    handleRemoveContraDoubleRow: rows.handleRemoveContraDoubleRow,

    // ── Layout 1c — Receipt double-entry
    receiptEntryMode: rows.receiptEntryMode,
    setReceiptEntryMode: rows.setReceiptEntryMode,
    receiptDoubleRows: rows.receiptDoubleRows,
    setReceiptDoubleRows: rows.setReceiptDoubleRows,
    handleUpdateReceiptDoubleRow: rows.handleUpdateReceiptDoubleRow,
    handleAddReceiptDoubleRow: rows.handleAddReceiptDoubleRow,
    handleRemoveReceiptDoubleRow: rows.handleRemoveReceiptDoubleRow,

    // ── Layout 1d — Payment double-entry
    paymentEntryMode: rows.paymentEntryMode,
    setPaymentEntryMode: rows.setPaymentEntryMode,
    paymentDoubleRows: rows.paymentDoubleRows,
    setPaymentDoubleRows: rows.setPaymentDoubleRows,
    handleUpdatePaymentDoubleRow: rows.handleUpdatePaymentDoubleRow,
    handleAddPaymentDoubleRow: rows.handleAddPaymentDoubleRow,
    handleRemovePaymentDoubleRow: rows.handleRemovePaymentDoubleRow,

    // ── Layout 2 — Journal
    journalEntryMode: rows.journalEntryMode,
    setJournalEntryMode: rows.setJournalEntryMode,
    journalRows: rows.journalRows,
    setJournalRows: rows.setJournalRows,
    handleUpdateJournalRow: rows.handleUpdateJournalRow,
    handleAddJournalRow: rows.handleAddJournalRow,
    handleRemoveJournalRow: rows.handleRemoveJournalRow,

    // ── Layout 3 — Sales / Purchase
    partyLedger: rows.partyLedger,
    partyBalance: rows.partyBalance,
    salesPurchaseLedger: rows.salesPurchaseLedger,
    salesPurchaseBalance: rows.salesPurchaseBalance,
    stockEntries: rows.stockEntries,
    handleUpdateStockRow: rows.handleUpdateStockRow,
    handleAddStockRow: rows.handleAddStockRow,
    handleRemoveStockRow: rows.handleRemoveStockRow,
    additionalEntries: rows.additionalEntries,
    setAdditionalEntries: rows.setAdditionalEntries,
    handleUpdateAdditionalRow: rows.handleUpdateAdditionalRow,
    handleAddAdditionalRow: rows.handleAddAdditionalRow,
    handleRemoveAdditionalRow: rows.handleRemoveAdditionalRow,

    // ── Context helpers
    checkIsCashOrBank: ledgers.checkIsCashOrBank,
    checkIsCash: ledgers.checkIsCash,
    checkIsBank: ledgers.checkIsBank,
    checkLedgerGroup: ledgers.checkLedgerGroup,
    companyId,
    fyId,
  };
}