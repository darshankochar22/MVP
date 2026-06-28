import type { MerchantProfileType } from '../entities/MerchantProfile';

export interface MerchantProfileAPI {
  merchantProfile: {
    create: (data: Partial<MerchantProfileType>) => Promise<{ success: boolean; profile: MerchantProfileType; error?: string }>;
    getAll: (company_id: number) => Promise<{ success: boolean; profiles: MerchantProfileType[]; error?: string }>;
    getById: (id: number) => Promise<{ success: boolean; profile: MerchantProfileType; error?: string }>;
    update: (data: Partial<MerchantProfileType>) => Promise<{ success: boolean; profile: MerchantProfileType; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
  };
}
