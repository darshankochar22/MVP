const budgetService = require('../budget/budgetService');
const auditTrailService = require('../auditTrail/auditTrailService');

const ENTITY_TYPE = 'budget';

module.exports = {
    create: async (event, data) => {
        const result = await budgetService.create(data);
        if (result && result.success && result.budget) {
            try {
                await auditTrailService.record({
                    company_id: result.budget.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: result.budget.budget_id,
                    action: 'create',
                    before: null,
                    after: result.budget,
                });
            } catch (err) {
                console.error('Error recording budget create audit:', err);
            }
        }
        return result;
    },

    getAll: async (event, company_id) => {
        return await budgetService.getAll(company_id);
    },

    getById: async (event, id) => {
        return await budgetService.getById(id);
    },

    update: async (event, data) => {
        let before = null;
        try {
            const snap = await budgetService.getById(data.budget_id);
            if (snap && snap.success) before = snap.budget;
        } catch (err) {
            console.error('Error fetching budget update snapshot:', err);
        }
        const result = await budgetService.update(data);
        if (result && result.success && result.budget) {
            try {
                await auditTrailService.record({
                    company_id: result.budget.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: result.budget.budget_id,
                    action: 'update',
                    before,
                    after: result.budget,
                });
            } catch (err) {
                console.error('Error recording budget update audit:', err);
            }
        }
        return result;
    },

    delete: async (event, id) => {
        let before = null;
        try {
            const snap = await budgetService.getById(id);
            if (snap && snap.success) before = snap.budget;
        } catch (err) {
            console.error('Error fetching budget delete snapshot:', err);
        }
        const result = await budgetService.delete(id);
        if (result && result.success && before) {
            try {
                await auditTrailService.record({
                    company_id: before.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: before.budget_id,
                    action: 'delete',
                    before,
                    after: null,
                });
            } catch (err) {
                console.error('Error recording budget delete audit:', err);
            }
        }
        return result;
    },
};
