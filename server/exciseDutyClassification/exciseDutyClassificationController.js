const exciseDutyClassificationService = require('../exciseDutyClassification/exciseDutyClassificationService');
const auditTrailService = require('../auditTrail/auditTrailService');

const ENTITY_TYPE = 'excise_duty_classification';

module.exports = {
    create: async (event, data) => {
        const result = await exciseDutyClassificationService.create(data);
        if (result && result.success && result.classification) {
            try {
                await auditTrailService.record({
                    company_id: result.classification.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: result.classification.excise_duty_classification_id,
                    action: 'create',
                    before: null,
                    after: result.classification,
                });
            } catch (err) {
                console.error('Error recording excise duty classification create audit:', err);
            }
        }
        return result;
    },

    getAll: async (event, company_id) => {
        return await exciseDutyClassificationService.getAll(company_id);
    },

    getById: async (event, id) => {
        return await exciseDutyClassificationService.getById(id);
    },

    update: async (event, data) => {
        let before = null;
        try {
            const snap = await exciseDutyClassificationService.getById(data.excise_duty_classification_id);
            if (snap && snap.success) before = snap.classification;
        } catch (err) {
            console.error('Error fetching excise duty classification update snapshot:', err);
        }
        const result = await exciseDutyClassificationService.update(data);
        if (result && result.success && result.classification) {
            try {
                await auditTrailService.record({
                    company_id: result.classification.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: result.classification.excise_duty_classification_id,
                    action: 'update',
                    before,
                    after: result.classification,
                });
            } catch (err) {
                console.error('Error recording excise duty classification update audit:', err);
            }
        }
        return result;
    },

    delete: async (event, id) => {
        let before = null;
        try {
            const snap = await exciseDutyClassificationService.getById(id);
            if (snap && snap.success) before = snap.classification;
        } catch (err) {
            console.error('Error fetching excise duty classification delete snapshot:', err);
        }
        const result = await exciseDutyClassificationService.delete(id);
        if (result && result.success && before) {
            try {
                await auditTrailService.record({
                    company_id: before.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: before.excise_duty_classification_id,
                    action: 'delete',
                    before,
                    after: null,
                });
            } catch (err) {
                console.error('Error recording excise duty classification delete audit:', err);
            }
        }
        return result;
    },
};
