const stockItemService = require('../stockItem/stockItemService');

module.exports = {
  create: async (event, data) => {
    return await stockItemService.create(data);
  },
  getAll: async (event, company_id) => {
    return await stockItemService.getAll(company_id);
  },
  getById: async (event, id) => {
    return await stockItemService.getById(id);
  },
  update: async (event, data) => {
    return await stockItemService.update(data);
  },
  delete: async (event, id) => {
    return await stockItemService.delete(id);
  },
  getByGroup: async (event, { company_id, group_id }) => {
    return await stockItemService.getByGroup(company_id, group_id);
  },
  getByCategory: async (event, { company_id, category_id }) => {
    return await stockItemService.getByCategory(company_id, category_id);
  },
};