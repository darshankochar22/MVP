import type { ExciseBookType } from '../entities/ExciseBook';

export interface ExciseBookAPI {
  exciseBook: {
    create: (data: Partial<ExciseBookType>) => Promise<{ success: boolean; exciseBook: ExciseBookType; error?: string }>;
    getAll: (company_id: number) => Promise<{ success: boolean; exciseBooks: ExciseBookType[]; error?: string }>;
    getById: (id: number) => Promise<{ success: boolean; exciseBook: ExciseBookType; error?: string }>;
    update: (data: Partial<ExciseBookType>) => Promise<{ success: boolean; exciseBook: ExciseBookType; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
  };
}
