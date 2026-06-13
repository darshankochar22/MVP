export interface PANCINDetailsAPI {
  panCINDetails: {
    getByCompany: (company_id: number) => Promise<{ success: boolean; panCINDetails: any | null; error?: string }>;
    upsert: (data: any) => Promise<{ success: boolean; panCINDetails?: any; error?: string }>;
  };
}
