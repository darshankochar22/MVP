const panCINDetailsService = require('./panCINDetailsService');

module.exports = {
  getByCompany: async (event, company_id) => {
    return await panCINDetailsService.getByCompany(company_id);
  },
  upsert: async (event, data) => {
    return await panCINDetailsService.upsert(data);
  },
};
