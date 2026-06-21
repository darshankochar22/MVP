module.exports = {
  run: async (company_id, fy_id, params = {}) => {
    const service = require('../universalReportService');
    return await service.getReconciliation(company_id, fy_id, { type: 'bank', viewType: 'unreconciled', ...params });
  }
};
