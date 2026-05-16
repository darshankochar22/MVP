const companyCreationSuccessService = require('../services/companyCreationSuccessService');

module.exports = {
  get: async (event, company_id) => {
    return await companyCreationSuccessService.get(company_id);
  },
  update: async (event, data) => {
    return await companyCreationSuccessService.update(data);
  },
};