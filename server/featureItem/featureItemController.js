const featureItemService = require('../featureItem/featureItemService');

module.exports = {
  getAll: async (event) => {
    return await featureItemService.getAll();
  },
  getById: async (event, id) => {
    return await featureItemService.getById(id);
  },
  getByGroup: async (event, group_id) => {
    return await featureItemService.getByGroup(group_id);
  },
};