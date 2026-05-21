import { useState, useCallback, useEffect, useMemo } from "react";
import { useCompany } from "../../../context/CompanyContext";
import type { LedgerType, GroupType, StockItemType, GodownType, UnitType } from "../../../types/api";

let idCounter = 0;
const nextId = () => `row_${++idCounter}_${Date.now()}`;

export interface ParticularRow {
  id: string;
  type: 'Dr' | 'Cr';
  ledger: LedgerType | null;
  ledgerBalance: string;
  amountRaw: string;
}

export interface StockEntryRow {
  id: string;
  stockItem: StockItemType | null;
  godown: GodownType | null;
  unit: UnitType | null;
  quantityRaw: string;
  rateRaw: string;
  amountRaw: string;
}

export type ActiveField =
  | { type: 'account' }
  | { type: 'party' }
  | { type: 'salesPurchase' }
  | { type: 'particular'; rowId: string }
  | { type: 'additional'; rowId: string }
  | { type: 'stockItem'; rowId: string }
  | { type: 'stockGodown'; rowId: string };

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDateDisplay = (dateStr: string | undefined): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}-${monthNames[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
};

const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function useVoucherForm() {
  const { selectedCompany, activeFY } = useCompany();

  // Basic Voucher Details
  const [voucherType, setVoucherType] = useState<string>("Receipt");
  const [voucherNumber, setVoucherNumber] = useState<number>(1);
  const [voucherNumberLoading, setVoucherNumberLoading] = useState(true);
  const [date] = useState<string>(todayStr());
  const [narration, setNarration] = useState<string>( "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // References (For F8/F9 Invoice layouts)
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [referenceDate, setReferenceDate] = useState<string>(todayStr());
  const [placeOfSupply, setPlaceOfSupply] = useState<string>("Select");

  // Selection Data Lists
  const [allLedgers, setAllLedgers] = useState<LedgerType[]>([]);
  const [allGroups, setAllGroups] = useState<GroupType[]>([]);
  const [allStockItems, setAllStockItems] = useState<StockItemType[]>([]);
  const [allGodowns, setAllGodowns] = useState<GodownType[]>([]);
  const [allUnits, setAllUnits] = useState<UnitType[]>([]);
  
  const [ledgersLoading, setLedgersLoading] = useState(false);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [activeField, setActiveField] = useState<ActiveField | null>(null);

  // Layout-specific States
  // 1. Single-Entry (Receipt F6, Payment F5, Contra F4)
  const [accountLedger, setAccountLedger] = useState<LedgerType | null>(null);
  const [accountBalance, setAccountBalance] = useState<string>("");
  const [particulars, setParticulars] = useState<ParticularRow[]>([
    { id: nextId(), type: 'Cr', ledger: null, ledgerBalance: "", amountRaw: "" }
  ]);

  // 2. Double-Entry (Journal F7)
  const [journalRows, setJournalRows] = useState<ParticularRow[]>([
    { id: nextId(), type: 'Dr', ledger: null, ledgerBalance: "", amountRaw: "" },
    { id: nextId(), type: 'Cr', ledger: null, ledgerBalance: "", amountRaw: "" }
  ]);

  // 3. Inventory Mode (Sales F8, Purchase F9)
  const [partyLedger, setPartyLedger] = useState<LedgerType | null>(null);
  const [partyBalance, setPartyBalance] = useState<string>("");
  const [salesPurchaseLedger, setSalesPurchaseLedger] = useState<LedgerType | null>(null);
  const [salesPurchaseBalance, setSalesPurchaseBalance] = useState<string>("");
  const [stockEntries, setStockEntries] = useState<StockEntryRow[]>([
    { id: nextId(), stockItem: null, godown: null, unit: null, quantityRaw: "", rateRaw: "", amountRaw: "" }
  ]);
  const [additionalEntries, setAdditionalEntries] = useState<ParticularRow[]>([]);

  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;

  // Context loading
  const fetchContextData = useCallback(async () => {
    if (!companyId) return;
    setLedgersLoading(true);
    try {
      const [ledRes, grpRes, itemRes, godRes, unitRes] = await Promise.all([
        window.api.ledger.getAll(companyId),
        window.api.group.getAll(companyId),
        window.api.stockItem.getAll(companyId),
        window.api.godown.getAll(companyId),
        window.api.unit.getAll(companyId),
      ]);
      if (ledRes.success) setAllLedgers((ledRes as any).ledgers || []);
      if (grpRes.success) setAllGroups((grpRes as any).groups || []);
      if (itemRes.success) setAllStockItems((itemRes as any).stockItems || []);
      if (godRes.success) setAllGodowns((godRes as any).godowns || []);
      if (unitRes.success) setAllUnits((unitRes as any).units || []);
    } catch {
      // ignore
    } finally {
      setLedgersLoading(false);
    }
  }, [companyId]);

  const fetchNextNumber = useCallback(async () => {
    if (!companyId || !fyId) return;
    try {
      const res = await window.api.voucher.getNextNumber(companyId, fyId, voucherType);
      if (res.success && res.nextNumber != null) {
        setVoucherNumber(res.nextNumber);
      }
    } catch {
      // ignore
    } finally {
      setVoucherNumberLoading(false);
    }
  }, [companyId, fyId, voucherType]);

  const fetchLedgerBalance = useCallback(async (ledgerId: number): Promise<string> => {
    if (!companyId || !fyId) return "";
    try {
      const res = await window.api.voucher.getLedgerBalance(ledgerId, companyId, fyId);
      if (res.success && res.balance != null) return res.balance;
    } catch {
      // ignore
    }
    return "";
  }, [companyId, fyId]);

  useEffect(() => {
    fetchContextData();
    fetchNextNumber();
  }, [fetchContextData, fetchNextNumber]);

  // Balance Sync Hooks
  useEffect(() => {
    if (accountLedger?.ledger_id) {
      fetchLedgerBalance(accountLedger.ledger_id).then(setAccountBalance);
    } else {
      setAccountBalance("");
    }
  }, [accountLedger, fetchLedgerBalance]);

  useEffect(() => {
    if (partyLedger?.ledger_id) {
      fetchLedgerBalance(partyLedger.ledger_id).then(partyBal => setPartyBalance(partyBal));
    } else {
      setPartyBalance("");
    }
  }, [partyLedger, fetchLedgerBalance]);

  useEffect(() => {
    if (salesPurchaseLedger?.ledger_id) {
      fetchLedgerBalance(salesPurchaseLedger.ledger_id).then(spBal => setSalesPurchaseBalance(spBal));
    } else {
      setSalesPurchaseBalance("");
    }
  }, [salesPurchaseLedger, fetchLedgerBalance]);

  // Lineage Helper: Checks recursively if a ledger's group is Cash or Bank
  const checkIsCashOrBank = useCallback((ledger: LedgerType | null): boolean => {
    if (!ledger || allGroups.length === 0) return false;
    
    const findGroup = (groupId?: number): GroupType | undefined => {
      return allGroups.find(g => g.group_id === groupId);
    };

    const checkGroup = (grp: GroupType): boolean => {
      const name = grp.name.toLowerCase().trim();
      if (["bank accounts", "bank od accounts", "bank od a/c", "bank od account", "cash-in-hand"].includes(name)) {
        return true;
      }
      if (grp.parent_group_id) {
        const parent = findGroup(grp.parent_group_id);
        if (parent) return checkGroup(parent);
      }
      return false;
    };

    const group = findGroup(ledger.group_id);
    return group ? checkGroup(group) : false;
  }, [allGroups]);

  // Adjust row type default based on voucher type
  useEffect(() => {
    if (voucherType === "Receipt") {
      setParticulars(prev => prev.map(p => ({ ...p, type: 'Cr' })));
    } else if (voucherType === "Payment") {
      setParticulars(prev => prev.map(p => ({ ...p, type: 'Dr' })));
    } else if (voucherType === "Contra") {
      setParticulars(prev => prev.map(p => ({ ...p, type: 'Cr' })));
    }
  }, [voucherType]);

  // Grand Total Computations
  const totalAmount = useMemo(() => {
    if (voucherType === "Journal") {
      return journalRows.reduce((sum, r) => sum + (r.type === 'Dr' ? (Number(r.amountRaw) || 0) : 0), 0);
    }
    if (voucherType === "Sales" || voucherType === "Purchase") {
      const stockSum = stockEntries.reduce((sum, r) => sum + (Number(r.amountRaw) || 0), 0);
      const adjSum = additionalEntries.reduce((sum, r) => {
        const amt = Number(r.amountRaw) || 0;
        if (voucherType === "Sales") {
          return r.type === 'Cr' ? sum + amt : sum - amt;
        } else {
          return r.type === 'Dr' ? sum + amt : sum - amt;
        }
      }, 0);
      return Math.max(0, stockSum + adjSum);
    }
    return particulars.reduce((sum, p) => sum + (Number(p.amountRaw) || 0), 0);
  }, [voucherType, particulars, journalRows, stockEntries, additionalEntries]);

  // Add / Edit handlers
  const handleAddParticularRow = useCallback(() => {
    setParticulars(prev => [...prev, { id: nextId(), type: voucherType === "Payment" ? 'Dr' : 'Cr', ledger: null, ledgerBalance: "", amountRaw: "" }]);
  }, [voucherType]);

  const handleUpdateParticularRow = useCallback(async (id: string, updates: Partial<Omit<ParticularRow, 'id'>>) => {
    setParticulars(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, ...updates };
    }));
    if (updates.ledger?.ledger_id) {
      const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
      setParticulars(prev => prev.map(p => {
        if (p.id !== id) return p;
        return { ...p, ledgerBalance: bal };
      }));
    }
  }, [fetchLedgerBalance]);

  const handleRemoveParticularRow = useCallback((id: string) => {
    setParticulars(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev);
  }, []);

  // Journal specific
  const handleAddJournalRow = useCallback(() => {
    const lastRow = journalRows[journalRows.length - 1];
    setJournalRows(prev => [...prev, { id: nextId(), type: lastRow ? lastRow.type : 'Dr', ledger: null, ledgerBalance: "", amountRaw: "" }]);
  }, [journalRows]);

  const handleUpdateJournalRow = useCallback(async (id: string, updates: Partial<Omit<ParticularRow, 'id'>>) => {
    setJournalRows(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, ...updates };
    }));
    if (updates.ledger?.ledger_id) {
      const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
      setJournalRows(prev => prev.map(p => {
        if (p.id !== id) return p;
        return { ...p, ledgerBalance: bal };
      }));
    }
  }, [fetchLedgerBalance]);

  const handleRemoveJournalRow = useCallback((id: string) => {
    setJournalRows(prev => prev.length > 2 ? prev.filter(p => p.id !== id) : prev);
  }, []);

  // Inventory Stock Entries
  const handleAddStockRow = useCallback(() => {
    setStockEntries(prev => [...prev, { id: nextId(), stockItem: null, godown: null, unit: null, quantityRaw: "", rateRaw: "", amountRaw: "" }]);
  }, []);

  const handleUpdateStockRow = useCallback(async (id: string, updates: Partial<Omit<StockEntryRow, 'id'>>) => {
    setStockEntries(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates };
      // Auto-compute amount if quantity or rate changed
      if (updates.quantityRaw !== undefined || updates.rateRaw !== undefined) {
        const qty = Number(updated.quantityRaw) || 0;
        const rate = Number(updated.rateRaw) || 0;
        updated.amountRaw = qty > 0 && rate > 0 ? (qty * rate).toFixed(2) : "";
      }
      return updated;
    }));
  }, []);

  const handleRemoveStockRow = useCallback((id: string) => {
    setStockEntries(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  }, []);

  // Additional adjust ledger adjustments
  const handleAddAdditionalRow = useCallback(() => {
    setAdditionalEntries(prev => [...prev, { id: nextId(), type: voucherType === "Sales" ? 'Cr' : 'Dr', ledger: null, ledgerBalance: "", amountRaw: "" }]);
  }, [voucherType]);

  const handleUpdateAdditionalRow = useCallback(async (id: string, updates: Partial<Omit<ParticularRow, 'id'>>) => {
    setAdditionalEntries(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, ...updates };
    }));
    if (updates.ledger?.ledger_id) {
      const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
      setAdditionalEntries(prev => prev.map(p => {
        if (p.id !== id) return p;
        return { ...p, ledgerBalance: bal };
      }));
    }
  }, [fetchLedgerBalance]);

  const handleRemoveAdditionalRow = useCallback((id: string) => {
    setAdditionalEntries(prev => prev.filter(p => p.id !== id));
  }, []);

  // Selection Field focuses
  const handleFieldFocus = useCallback((field: ActiveField) => {
    setActiveField(field);
    setLedgerSearchTerm("");
    setStockSearchTerm("");
  }, []);

  const handleFieldBlur = useCallback(() => {
    setActiveField(null);
  }, []);

  // Universal Selection Selector
  const handleLedgerPanelSelect = useCallback((ledger: LedgerType) => {
    if (!activeField) return;
    if (activeField.type === 'account') {
      setAccountLedger(ledger);
    } else if (activeField.type === 'party') {
      setPartyLedger(ledger);
    } else if (activeField.type === 'salesPurchase') {
      setSalesPurchaseLedger(ledger);
    } else if (activeField.type === 'particular') {
      handleUpdateParticularRow(activeField.rowId, { ledger });
    } else if (activeField.type === 'additional') {
      handleUpdateAdditionalRow(activeField.rowId, { ledger });
    } else if (activeField.type === 'stockItem') {
      // Find the row and update stock details
      const stockRow = stockEntries.find(r => r.id === activeField.rowId);
      if (stockRow) {
        // Expose unit if matches stock item
        const matchingUnit = allUnits.find(u => u.unit_id === (ledger as any).unit_id) || null;
        handleUpdateStockRow(activeField.rowId, {
          stockItem: ledger as any,
          unit: matchingUnit
        });
      }
    }
    setLedgerSearchTerm(ledger.name);
    setStockSearchTerm(ledger.name);
  }, [activeField, handleUpdateParticularRow, handleUpdateAdditionalRow, handleUpdateStockRow, stockEntries, allUnits]);

  const resetForm = useCallback(() => {
    setAccountLedger(null);
    setAccountBalance("");
    setPartyLedger(null);
    setPartyBalance("");
    setSalesPurchaseLedger(null);
    setSalesPurchaseBalance("");
    setParticulars([{ id: nextId(), type: voucherType === "Payment" ? 'Dr' : 'Cr', ledger: null, ledgerBalance: "", amountRaw: "" }]);
    setJournalRows([
      { id: nextId(), type: 'Dr', ledger: null, ledgerBalance: "", amountRaw: "" },
      { id: nextId(), type: 'Cr', ledger: null, ledgerBalance: "", amountRaw: "" }
    ]);
    setStockEntries([
      { id: nextId(), stockItem: null, godown: null, unit: null, quantityRaw: "", rateRaw: "", amountRaw: "" }
    ]);
    setAdditionalEntries([]);
    setReferenceNumber("");
    setNarration("");
    setError(null);
    setSuccess(null);
    setActiveField(null);
    setLedgerSearchTerm("");
    setStockSearchTerm("");
    fetchNextNumber();
  }, [voucherType, fetchNextNumber]);

  const validate = useCallback((): string | null => {
    if (!companyId) return "No company selected";
    if (!fyId) return "No active financial year";

    // 1. Single-Entry Validations (Receipt, Payment, Contra)
    if (["Receipt", "Payment", "Contra"].includes(voucherType)) {
      if (!accountLedger) return "Account Name is required";
      if (!checkIsCashOrBank(accountLedger)) return "Top Account must be a Cash or Bank ledger";

      const filledRows = particulars.filter(p => p.ledger && Number(p.amountRaw) > 0);
      if (filledRows.length === 0) return "No particulars entered";

      for (const row of filledRows) {
        if (row.ledger?.ledger_id === accountLedger.ledger_id) {
          return "Same ledger cannot be used in both Account and Particulars";
        }
        if (voucherType === "Contra" && !checkIsCashOrBank(row.ledger)) {
          return "Contra vouchers strictly restrict both sides to Cash/Bank ledgers";
        }
        if (["Receipt", "Payment"].includes(voucherType) && checkIsCashOrBank(row.ledger)) {
          return `${voucherType} vouchers restrict row Particulars to non-Cash/Bank ledgers`;
        }
      }
      if (totalAmount <= 0) return "Total amount must be greater than 0";
    }

    // 2. Journal Validations (F7)
    if (voucherType === "Journal") {
      const filled = journalRows.filter(r => r.ledger && Number(r.amountRaw) > 0);
      if (filled.length < 2) return "At least two valid Journal ledger entries are required";
      
      const drTotal = journalRows.reduce((sum, r) => sum + (r.type === 'Dr' ? (Number(r.amountRaw) || 0) : 0), 0);
      const crTotal = journalRows.reduce((sum, r) => sum + (r.type === 'Cr' ? (Number(r.amountRaw) || 0) : 0), 0);
      
      if (Math.abs(drTotal - crTotal) > 0.01) {
        return `Debit (${drTotal.toFixed(2)}) and Credit (${crTotal.toFixed(2)}) amounts must be exactly equal`;
      }
      if (drTotal <= 0) return "Journal amount must be greater than 0";
    }

    // 3. Sales & Purchase Validations (F8, F9)
    if (["Sales", "Purchase"].includes(voucherType)) {
      if (!partyLedger) return "Party A/c Name is required";
      if (!salesPurchaseLedger) return `${voucherType} Ledger is required`;

      const filledItems = stockEntries.filter(r => r.stockItem && Number(r.quantityRaw) > 0 && Number(r.rateRaw) > 0);
      if (filledItems.length === 0) return "At least one valid inventory Stock Item is required";

      if (partyLedger.ledger_id === salesPurchaseLedger.ledger_id) {
        return `Same ledger cannot be used for both Party and ${voucherType} Accounts`;
      }
      if (totalAmount <= 0) return "Total amount must be greater than 0";
    }

    return null;
  }, [voucherType, accountLedger, particulars, journalRows, stockEntries, partyLedger, salesPurchaseLedger, totalAmount, companyId, fyId, checkIsCashOrBank]);

  const handleSubmit = useCallback(async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let entries: any[] = [];
      let stock_entries: any[] = [];

      // Package Payloads based on Voucher Type
      if (["Receipt", "Payment", "Contra"].includes(voucherType)) {
        const filledRows = particulars.filter(p => p.ledger && Number(p.amountRaw) > 0);
        
        // Receipt: Top Account is DEBITED, Particulars are CREDITED
        // Payment: Top Account is CREDITED, Particulars are DEBITED
        // Contra: Top Account is DEBITED (if RCT style) / CREDITED (if PMT style)
        // Wait, standard double-entry:
        // Contra usually Debits the receiving ledger (Top Account) and Credits the source.
        const topAccountType = voucherType === "Payment" ? 'Cr' : 'Dr';
        const rowsType = voucherType === "Payment" ? 'Dr' : 'Cr';

        entries = [
          {
            ledger_id: accountLedger!.ledger_id,
            ledger_name: accountLedger!.name,
            type: topAccountType,
            amount: totalAmount,
            currency: 'INR',
          },
          ...filledRows.map(p => ({
            ledger_id: p.ledger!.ledger_id,
            ledger_name: p.ledger!.name,
            type: rowsType,
            amount: Number(p.amountRaw),
            currency: 'INR',
          })),
        ];
      } else if (voucherType === "Journal") {
        const filled = journalRows.filter(r => r.ledger && Number(r.amountRaw) > 0);
        entries = filled.map(r => ({
          ledger_id: r.ledger!.ledger_id,
          ledger_name: r.ledger!.name,
          type: r.type,
          amount: Number(r.amountRaw),
          currency: 'INR',
        }));
      } else if (["Sales", "Purchase"].includes(voucherType)) {
        const filledItems = stockEntries.filter(r => r.stockItem && Number(r.quantityRaw) > 0 && Number(r.rateRaw) > 0);
        const stockSubtotal = filledItems.reduce((sum, r) => sum + (Number(r.amountRaw) || 0), 0);

        stock_entries = filledItems.map(r => ({
          stock_item_id: (r.stockItem as any).stock_item_id,
          item_name: r.stockItem!.name,
          godown_id: r.godown?.godown_id || null,
          unit_id: r.unit?.unit_id || null,
          quantity: Number(r.quantityRaw),
          rate: Number(r.rateRaw),
          amount: Number(r.amountRaw),
        }));

        // Build Balancing Accounting Entries for Sales/Purchase
        // F8 Sales: Party Dr (total), Sales Cr (subtotal), Taxes/Adj Cr (Cr if negative Dr, etc)
        // F9 Purchase: Purchase Dr (subtotal), Taxes/Adj Dr, Party Cr (total)
        const partyType = voucherType === "Sales" ? 'Dr' : 'Cr';
        const salesPurchaseType = voucherType === "Sales" ? 'Cr' : 'Dr';

        entries = [
          {
            ledger_id: partyLedger!.ledger_id,
            ledger_name: partyLedger!.name,
            type: partyType,
            amount: totalAmount,
            currency: 'INR',
          },
          {
            ledger_id: salesPurchaseLedger!.ledger_id,
            ledger_name: salesPurchaseLedger!.name,
            type: salesPurchaseType,
            amount: stockSubtotal,
            currency: 'INR',
          },
          ...additionalEntries.filter(p => p.ledger && Number(p.amountRaw) > 0).map(p => ({
            ledger_id: p.ledger!.ledger_id,
            ledger_name: p.ledger!.name,
            type: p.type,
            amount: Number(p.amountRaw),
            currency: 'INR',
          }))
        ];
      }

      const payload: any = {
        company_id: companyId!,
        fy_id: fyId!,
        voucher_type: voucherType,
        date,
        reference_number: referenceNumber || null,
        reference_date: referenceDate || null,
        place_of_supply: placeOfSupply !== "Select" ? placeOfSupply : null,
        narration: narration || null,
        is_accounting_voucher: 1,
        is_invoice: ["Sales", "Purchase"].includes(voucherType) ? 1 : 0,
        is_inventory_voucher: ["Sales", "Purchase"].includes(voucherType) ? 1 : 0,
        entries,
        stock_entries,
      };

      const res = await window.api.voucher.create(payload);
      if (res.success) {
        const savedNumber = voucherNumber;
        resetForm();
        setSuccess(`Voucher No. ${savedNumber} saved successfully`);
      } else {
        setError(res.error || "Failed to save voucher");
      }
    } catch (e: any) {
      setError(e.message || "Unexpected error");
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, companyId, fyId, voucherType, date, referenceNumber, referenceDate, placeOfSupply, narration, totalAmount, accountLedger, particulars, journalRows, partyLedger, salesPurchaseLedger, stockEntries, additionalEntries, voucherNumber, resetForm]);

  const dateDisplay = useMemo(() => formatDateDisplay(date), [date]);

  return {
    // Shared Form Attributes
    voucherType,
    setVoucherType,
    voucherNumber,
    voucherNumberLoading,
    date,
    dateDisplay,
    narration,
    setNarration,
    totalAmount,
    isSubmitting,
    error,
    setError,
    success,
    setSuccess,
    handleSubmit,
    resetForm,

    // Reference Details (F8/F9)
    referenceNumber,
    setReferenceNumber,
    referenceDate,
    setReferenceDate,
    placeOfSupply,
    setPlaceOfSupply,

    // Lists & Dropdown panels
    allLedgers,
    allStockItems,
    allGodowns,
    allUnits,
    ledgersLoading,
    ledgerSearchTerm,
    setLedgerSearchTerm,
    stockSearchTerm,
    setStockSearchTerm,
    activeField,
    handleFieldFocus,
    handleFieldBlur,
    handleLedgerPanelSelect,

    // 1. Single-Entry States (F4, F5, F6)
    accountLedger,
    accountBalance,
    particulars,
    handleUpdateParticularRow,
    handleAddParticularRow,
    handleRemoveParticularRow,

    // 2. Double-Entry Journal States (F7)
    journalRows,
    handleUpdateJournalRow,
    handleAddJournalRow,
    handleRemoveJournalRow,

    // 3. Inventory States (F8, F9)
    partyLedger,
    partyBalance,
    salesPurchaseLedger,
    salesPurchaseBalance,
    stockEntries,
    handleUpdateStockRow,
    handleAddStockRow,
    handleRemoveStockRow,
    additionalEntries,
    handleUpdateAdditionalRow,
    handleAddAdditionalRow,
    handleRemoveAdditionalRow,

    // Context Checkers
    checkIsCashOrBank,
    companyId,
    fyId,
  };
}
