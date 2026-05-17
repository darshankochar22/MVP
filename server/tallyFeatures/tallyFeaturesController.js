const tallyFeaturesService = require('../tallyFeatures/tallyFeaturesService');

module.exports = {
  get: async (event, company_id) => {
    return await tallyFeaturesService.get(company_id);
  },
  update: async (event, data) => {
    return await tallyFeaturesService.update(data);
  },
  reset: async (event, company_id) => {
    return await tallyFeaturesService.reset(company_id);
  },
};