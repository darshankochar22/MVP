import type { TDSNatureOfPaymentType } from '../entities/TDSNatureOfPayment';

export interface CreateTDSNatureOfPaymentInput {
  company_id: number;
  name: string;
  section?: string;
  payment_code?: string;
  remittance_code?: string;
  rate_individual_with_pan?: number;
  rate_other_with_pan?: number;
  is_zero_rated?: number;
  threshold_limit?: number;
  calculate_tax_on_exceeding_threshold?: number;
}

export interface UpdateTDSNatureOfPaymentInput
  extends Partial<CreateTDSNatureOfPaymentInput> {
  tds_id: number;
}

interface TDSNatureOfPaymentResult {
  success: boolean;
  tdsNatureOfPayment?: TDSNatureOfPaymentType;
  error?: string;
}

interface TDSNatureOfPaymentListResult {
  success: boolean;
  tdsNatureOfPaymentList?: TDSNatureOfPaymentType[];
  error?: string;
}

interface TDSNatureOfPaymentDeleteResult {
  success: boolean;
  error?: string;
}

export interface TDSNatureOfPaymentAPI {
  tdsNatureOfPayment: {
    create: (data: CreateTDSNatureOfPaymentInput) => Promise<TDSNatureOfPaymentResult>;
    getAll: (company_id: number) => Promise<TDSNatureOfPaymentListResult>;
    getById: (id: number) => Promise<TDSNatureOfPaymentResult>;
    update: (data: UpdateTDSNatureOfPaymentInput) => Promise<TDSNatureOfPaymentResult>;
    delete: (id: number) => Promise<TDSNatureOfPaymentDeleteResult>;
  };
}
