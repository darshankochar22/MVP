const scenarioService = require('../scenario/scenarioService');
const auditTrailService = require('../auditTrail/auditTrailService');

const ENTITY_TYPE = 'scenario';

module.exports = {
    create: async (event, data) => {
        const result = await scenarioService.create(data);
        if (result && result.success && result.scenario) {
            try {
                await auditTrailService.record({
                    company_id: result.scenario.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: result.scenario.scenario_id,
                    action: 'create',
                    before: null,
                    after: result.scenario,
                });
            } catch (err) {
                console.error('Error recording scenario create audit:', err);
            }
        }
        return result;
    },

    getAll: async (event, company_id) => {
        return await scenarioService.getAll(company_id);
    },

    getById: async (event, id) => {
        return await scenarioService.getById(id);
    },

    update: async (event, data) => {
        let before = null;
        try {
            const snap = await scenarioService.getById(data.scenario_id);
            if (snap && snap.success) before = snap.scenario;
        } catch (err) {
            console.error('Error fetching scenario update snapshot:', err);
        }
        const result = await scenarioService.update(data);
        if (result && result.success && result.scenario) {
            try {
                await auditTrailService.record({
                    company_id: result.scenario.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: result.scenario.scenario_id,
                    action: 'update',
                    before,
                    after: result.scenario,
                });
            } catch (err) {
                console.error('Error recording scenario update audit:', err);
            }
        }
        return result;
    },

    delete: async (event, id) => {
        let before = null;
        try {
            const snap = await scenarioService.getById(id);
            if (snap && snap.success) before = snap.scenario;
        } catch (err) {
            console.error('Error fetching scenario delete snapshot:', err);
        }
        const result = await scenarioService.delete(id);
        if (result && result.success && before) {
            try {
                await auditTrailService.record({
                    company_id: before.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: before.scenario_id,
                    action: 'delete',
                    before,
                    after: null,
                });
            } catch (err) {
                console.error('Error recording scenario delete audit:', err);
            }
        }
        return result;
    },
};
