// Excise Book master (TallyPrime Statutory Master, issue #141). A named master
// carrying voucher-numbering config plus three multi-row numbering tables.

export const EXCISE_NUMBERING_METHODS = [
  "Automatic",
  "Automatic (Manual Override)",
  "Manual",
  "Multi-user Auto",
] as const;
export type ExciseNumberingMethod = (typeof EXCISE_NUMBERING_METHODS)[number];

export interface ExciseBookRestartRow {
  applicable_from: string;
  starting_number: number;
  particulars: string;
}

export interface ExciseBookAffixRow {
  applicable_from: string;
  particulars: string;
}

export interface ExciseBookType {
  excise_book_id?: number;
  company_id?: number;
  name: string;
  alias?: string | null;
  numbering_method?: ExciseNumberingMethod | string;
  prevent_duplicates?: number;
  starting_number?: number;
  width_of_numerical_part?: number;
  prefill_with_zero?: number;
  used_for?: string | null;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
  restart_numbering?: ExciseBookRestartRow[];
  prefix_details?: ExciseBookAffixRow[];
  suffix_details?: ExciseBookAffixRow[];
}

export const EMPTY_RESTART_ROW: ExciseBookRestartRow = {
  applicable_from: "",
  starting_number: 1,
  particulars: "",
};

export const EMPTY_AFFIX_ROW: ExciseBookAffixRow = {
  applicable_from: "",
  particulars: "",
};
