const dayBookReportService = require('../services/dayBookReportService');

module.exports = {
  create: async (event, data) => {
    return await dayBookReportService.create(data);
  },
  getAll: async (event, company_id) => {
    return await dayBookReportService.getAll(company_id);
  },
  getById: async (event, id) => {
    return await dayBookReportService.getById(id);
  },
  delete: async (event, id) => {
    return await dayBookReportService.delete(id);
  },
};