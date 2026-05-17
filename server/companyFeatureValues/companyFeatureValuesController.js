const companyFeatureValuesService = require('../companyFeatureValues/companyFeatureValuesService');

module.exports = {
  get: async (event, company_id) => {
    return await companyFeatureValuesService.get(company_id);
  },
  getByGroup: async (event, { company_id, group_id }) => {
    return await companyFeatureValuesService.getByGroup(company_id, group_id);
  },
  update: async (event, data) => {
    return await companyFeatureValuesService.update(data);
  },
  updateBulk: async (event, { company_id, values }) => {
    return await companyFeatureValuesService.updateBulk(company_id, values);
  },
};