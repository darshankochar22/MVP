const exciseBookService = require('../exciseBook/exciseBookService');
const auditTrailService = require('../auditTrail/auditTrailService');

const ENTITY_TYPE = 'excise_book';

module.exports = {
    create: async (event, data) => {
        const result = await exciseBookService.create(data);
        if (result && result.success && result.exciseBook) {
            try {
                await auditTrailService.record({
                    company_id: result.exciseBook.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: result.exciseBook.excise_book_id,
                    action: 'create',
                    before: null,
                    after: result.exciseBook,
                });
            } catch (err) {
                console.error('Error recording excise book create audit:', err);
            }
        }
        return result;
    },

    getAll: async (event, company_id) => {
        return await exciseBookService.getAll(company_id);
    },

    getById: async (event, id) => {
        return await exciseBookService.getById(id);
    },

    update: async (event, data) => {
        let before = null;
        try {
            const snap = await exciseBookService.getById(data.excise_book_id);
            if (snap && snap.success) before = snap.exciseBook;
        } catch (err) {
            console.error('Error fetching excise book update snapshot:', err);
        }
        const result = await exciseBookService.update(data);
        if (result && result.success && result.exciseBook) {
            try {
                await auditTrailService.record({
                    company_id: result.exciseBook.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: result.exciseBook.excise_book_id,
                    action: 'update',
                    before,
                    after: result.exciseBook,
                });
            } catch (err) {
                console.error('Error recording excise book update audit:', err);
            }
        }
        return result;
    },

    delete: async (event, id) => {
        let before = null;
        try {
            const snap = await exciseBookService.getById(id);
            if (snap && snap.success) before = snap.exciseBook;
        } catch (err) {
            console.error('Error fetching excise book delete snapshot:', err);
        }
        const result = await exciseBookService.delete(id);
        if (result && result.success && before) {
            try {
                await auditTrailService.record({
                    company_id: before.company_id,
                    entity_type: ENTITY_TYPE,
                    entity_id: before.excise_book_id,
                    action: 'delete',
                    before,
                    after: null,
                });
            } catch (err) {
                console.error('Error recording excise book delete audit:', err);
            }
        }
        return result;
    },
};
