const attendanceService = require('./attendanceService');

module.exports = {
  create: async (event, data) => {
    return await attendanceService.create(data);
  },

  getAll: async (event, company_id) => {
    return await attendanceService.getAll(company_id);
  },

  getById: async (event, id) => {
    return await attendanceService.getById(id);
  },

  delete: async (event, id) => {
    return await attendanceService.delete(id);
  },

  getNextNumber: async (event, { company_id }) => {
    return await attendanceService.getNextVoucherNumber(company_id);
  },
};
