const payrollUnitService = require('../services/payrollUnitService');

module.exports = {
  create: async (event, data) => {
    return await payrollUnitService.create(data);
  },
  getAll: async (event, company_id) => {
    return await payrollUnitService.getAll(company_id);
  },
  getById: async (event, id) => {
    return await payrollUnitService.getById(id);
  },
  update: async (event, data) => {
    return await payrollUnitService.update(data);
  },
  delete: async (event, id) => {
    return await payrollUnitService.delete(id);
  },
};