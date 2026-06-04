export interface PhysicalStockLine {
  line_id?: number;
  physical_stock_entry_id?: number;
  stock_item_id: number;
  item_name?: string;
  godown_id?: number | null;
  godown_name?: string;
  batch_no?: string | null;
  lot_no?: string | null;
  manufacturing_date?: string | null;
  expiry_date?: string | null;
  quantity: number;
  rate: number;
  amount: number;
  line_order: number;
}

export interface PhysicalStockEntry {
  physical_stock_entry_id?: number;
  company_id: number;
  voucher_no?: string;
  voucher_date: string;
  reference_no?: string | null;
  narration?: string | null;
  is_optional?: number;
  is_post_dated?: number;
  lines?: PhysicalStockLine[];
  created_at?: string;
  updated_at?: string;
}

export interface PhysicalStockAPI {
  physicalStock: {
    create: (data: PhysicalStockEntry) => Promise<{ success: boolean; physical_stock_entry_id?: number; voucher_no?: string; error?: string }>;
    getAll: (company_id: number) => Promise<{ success: boolean; entries?: PhysicalStockEntry[]; error?: string }>;
    getById: (id: number) => Promise<{ success: boolean; entry?: PhysicalStockEntry; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
    getNextNumber: (company_id: number) => Promise<{ success: boolean; nextNumber?: string; error?: string }>;
  };
}
