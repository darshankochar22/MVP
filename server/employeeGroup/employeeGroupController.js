const employeeGroupService = require('../employeeGroup/employeeGroupService');

module.exports = {
  create: async (event, data) => {
    return await employeeGroupService.create(data);
  },
  getAll: async (event, company_id) => {
    return await employeeGroupService.getAll(company_id);
  },
  getById: async (event, id) => {
    return await employeeGroupService.getById(id);
  },
  update: async (event, data) => {
    return await employeeGroupService.update(data);
  },
  delete: async (event, id) => {
    return await employeeGroupService.delete(id);
  },
  getTree: async (event, company_id) => {
    return await employeeGroupService.getTree(company_id);
  },
};