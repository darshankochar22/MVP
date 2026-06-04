// transactions/types/index.ts
// ─── Shared types used across all voucher hooks and components ────────────────

export interface ParticularRow {
  id: string;
  type: "Dr" | "Cr";
  ledger: import("../../../types/api").LedgerType | null;
  ledgerBalance: string;
  amountRaw: string;
  costCentres?: { cost_centre_id: number; amount: number }[];
  billReferences?: {
    bill_name: string;
    bill_type: "New Ref" | "Agst Ref" | "Advance" | "On Account";
    amount: number;
    credit_period?: string;
  }[];
}

export interface StockEntryRow {
  id: string;
  stockItem: import("../../../types/api").StockItemType | null;
  godown: import("../../../types/api").GodownType | null;
  unit: import("../../../types/api").UnitType | null;
  quantityRaw: string;
  rateRaw: string;
  amountRaw: string;
}

export type ActiveField =
  | { type: "account" }
  | { type: "party" }
  | { type: "salesPurchase" }
  | { type: "particular"; rowId: string }
  | { type: "additional"; rowId: string }
  | { type: "stockItem"; rowId: string }
  | { type: "stockGodown"; rowId: string };

export type ActiveAllocation =
  | {
      type: "billWise";
      rowId: string;
      ledgerId: number;
      ledgerName: string;
      amount: number;
      dcType?: "Dr" | "Cr";
      initialAllocations?: any[];
    }
  | {
      type: "billWiseParty";
      ledgerId: number;
      ledgerName: string;
      amount: number;
      dcType?: "Dr" | "Cr";
      initialAllocations?: any[];
    }
  | {
      type: "costCentre";
      rowId: string;
      ledgerId: number;
      ledgerName: string;
      amount: number;
      initialAllocations?: any[];
    }
  | {
      type: "bankDetails";
      rowId: string;
      ledgerId: number;
      ledgerName: string;
      amount: number;
      initialDetails?: any;
      allowCash?: boolean;
    }
  | {
      type: "partyBankDetails";
      ledgerId: number;
      ledgerName: string;
      amount: number;
      initialDetails?: any;
    }
  | {
      type: "cashDenomination";
      rowId: string;
      ledgerId: number;
      ledgerName: string;
      amount: number;
      initialDetails?: any;
    }
  | null;
