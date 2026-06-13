export interface CompanyGSTDetailsAPI {
  companyGSTDetails: {
    getByCompany: (company_id: number) => Promise<{ success: boolean; gstDetails: any | null; error?: string }>;
    upsert: (data: any) => Promise<{ success: boolean; gstDetails?: any; error?: string }>;
  };
}