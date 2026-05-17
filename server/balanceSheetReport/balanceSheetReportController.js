const balanceSheetReportService = require('../balanceSheetReport/balanceSheetReportService');

module.exports = {
  create: async (event, data) => {
    return await balanceSheetReportService.create(data);
  },
  getAll: async (event, company_id) => {
    return await balanceSheetReportService.getAll(company_id);
  },
  getById: async (event, id) => {
    return await balanceSheetReportService.getById(id);
  },
  delete: async (event, id) => {
    return await balanceSheetReportService.delete(id);
  },
};