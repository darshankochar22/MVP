const taxUnitService = require('../taxUnits/taxUnitServices');

module.exports = {
    create: async (event, data) => {
        return await taxUnitService.create(data);
    },

    getAll: async (event, company_id) => {
        return await taxUnitService.getAll(company_id);
    },

    getById: async (event, id) => {
        return await taxUnitService.getById(id);
    },

    update: async (event, data) => {
        return await taxUnitService.update(data);
    },

    delete: async (event, id) => {
        return await taxUnitService.delete(id);
    },
};