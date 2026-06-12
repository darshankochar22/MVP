import type { TaxUnitType } from '@/types/entities';

export const taxUnitApi = {
  create: (data: TaxUnitType) => window.api.taxUnit.create(data),
  getAll: (company_id: number) => window.api.taxUnit.getAll(company_id),
  getById: (id: number) => window.api.taxUnit.getById(id),
  update: (data: TaxUnitType & { tax_unit_id: number }) =>
    window.api.taxUnit.update(data),
  delete: (id: number) => window.api.taxUnit.delete(id),
};