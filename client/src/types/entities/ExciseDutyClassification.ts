export interface ExciseDutyClassificationType {
  excise_duty_classification_id?: number;
  company_id?: number;
  name: string;
  duty_code?: string | null;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
  calculation_methods?: string[];
}
