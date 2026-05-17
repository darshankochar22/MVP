const voucherEntryActionsService = require('../services/voucherEntryActionsService');

module.exports = {
  create: async (event, data) => {
    return await voucherEntryActionsService.create(data);
  },
  getAll: async (event, company_id) => {
    return await voucherEntryActionsService.getAll(company_id);
  },
  getByVoucher: async (event, voucher_id) => {
    return await voucherEntryActionsService.getByVoucher(voucher_id);
  },
  delete: async (event, id) => {
    return await voucherEntryActionsService.delete(id);
  },
};