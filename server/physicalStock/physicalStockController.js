const physicalStockService = require('./physicalStockService');

module.exports = {
  create: async (event, data) => {
    return await physicalStockService.create(data);
  },

  getAll: async (event, company_id) => {
    return await physicalStockService.getAll(company_id);
  },

  getById: async (event, id) => {
    return await physicalStockService.getById(id);
  },

  delete: async (event, id) => {
    return await physicalStockService.delete(id);
  },

  getNextNumber: async (event, { company_id }) => {
    return await physicalStockService.getNextVoucherNumber(company_id);
  },
};
