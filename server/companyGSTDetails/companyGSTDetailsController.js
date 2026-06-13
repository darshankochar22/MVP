const companyGSTDetailsService = require('./companyGSTDetailsService');

module.exports = {
  getByCompany: async (event, company_id) => {
    return await companyGSTDetailsService.getByCompany(company_id);
  },
  upsert: async (event, data) => {
    return await companyGSTDetailsService.upsert(data);
  },
};
