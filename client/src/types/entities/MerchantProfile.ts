// Merchant Profile — named master under "Payment Request" (Issue #139).

export const PAYMENT_METHODS = ["PayU", "RazorPay", "UPI"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface MerchantProfileType {
  merchant_profile_id?: number;
  company_id?: number;
  name: string;
  payment_method?: PaymentMethod | string;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
}
