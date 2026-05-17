const featureGroupService = require('../featureGroup/featureGroupService');

module.exports = {
  getAll: async (event) => {
    return await featureGroupService.getAll();
  },
  getById: async (event, id) => {
    return await featureGroupService.getById(id);
  },
};