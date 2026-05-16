const featureGroupService = require('../services/featureGroupService');

module.exports = {
  getAll: async (event) => {
    return await featureGroupService.getAll();
  },
  getById: async (event, id) => {
    return await featureGroupService.getById(id);
  },
};