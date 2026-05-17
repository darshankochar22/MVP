const trialBalanceReportService = require('../trialBalanceReport/trialBalanceReportService');

module.exports = {
  create: async (event, data) => {
    return await trialBalanceReportService.create(data);
  },
  getAll: async (event, company_id) => {
    return await trialBalanceReportService.getAll(company_id);
  },
  getById: async (event, id) => {
    return await trialBalanceReportService.getById(id);
  },
  delete: async (event, id) => {
    return await trialBalanceReportService.delete(id);
  },
};