import type { ExciseDutyClassificationType } from '../entities/ExciseDutyClassification';

export interface ExciseDutyClassificationAPI {
  exciseDutyClassification: {
    create: (data: Partial<ExciseDutyClassificationType>) => Promise<{ success: boolean; classification: ExciseDutyClassificationType; error?: string }>;
    getAll: (company_id: number) => Promise<{ success: boolean; classifications: ExciseDutyClassificationType[]; error?: string }>;
    getById: (id: number) => Promise<{ success: boolean; classification: ExciseDutyClassificationType; error?: string }>;
    update: (data: Partial<ExciseDutyClassificationType>) => Promise<{ success: boolean; classification: ExciseDutyClassificationType; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
  };
}
