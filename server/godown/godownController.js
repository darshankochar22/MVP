const godownService = require('../godown/godownService');

module.exports = {
  create: async (event, data) => {
    return await godownService.create(data);
  },
  getAll: async (event, company_id) => {
    return await godownService.getAll(company_id);
  },
  getById: async (event, id) => {
    return await godownService.getById(id);
  },
  update: async (event, data) => {
    return await godownService.update(data);
  },
  delete: async (event, id) => {
    return await godownService.delete(id);
  },
  getTree: async (event, company_id) => {
    return await godownService.getTree(company_id);
  },
};