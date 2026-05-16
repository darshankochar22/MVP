const profitLossReportService = require('../services/profitLossReportService');

module.exports = {
  create: async (event, data) => {
    return await profitLossReportService.create(data);
  },
  getAll: async (event, company_id) => {
    return await profitLossReportService.getAll(company_id);
  },
  getById: async (event, id) => {
    return await profitLossReportService.getById(id);
  },
  delete: async (event, id) => {
    return await profitLossReportService.delete(id);
  },
};