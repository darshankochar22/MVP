const voucherTypeService = require('../services/voucherTypeService');

module.exports = {
  create: async (event, data) => {
    return await voucherTypeService.create(data);
  },
  getAll: async (event, company_id) => {
    return await voucherTypeService.getAll(company_id);
  },
  getById: async (event, id) => {
    return await voucherTypeService.getById(id);
  },
  update: async (event, data) => {
    return await voucherTypeService.update(data);
  },
  delete: async (event, id) => {
    return await voucherTypeService.delete(id);
  },
  getConfig: async (event, voucher_type_id) => {
    return await voucherTypeService.getConfig(voucher_type_id);
  },
  updateConfig: async (event, data) => {
    return await voucherTypeService.updateConfig(data);
  },
};