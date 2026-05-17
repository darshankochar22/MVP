const employeeService = require('../employee/employeeService');

module.exports = {
  create: async (event, data) => {
    return await employeeService.create(data);
  },
  getAll: async (event, company_id) => {
    return await employeeService.getAll(company_id);
  },
  getById: async (event, id) => {
    return await employeeService.getById(id);
  },
  update: async (event, data) => {
    return await employeeService.update(data);
  },
  delete: async (event, id) => {
    return await employeeService.delete(id);
  },
  getByGroup: async (event, { company_id, employee_group_id }) => {
    return await employeeService.getByGroup(company_id, employee_group_id);
  },
};