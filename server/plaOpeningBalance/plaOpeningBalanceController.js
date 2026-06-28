const plaOpeningBalanceService = require('./plaOpeningBalanceService');
const auditTrailService = require('../auditTrail/auditTrailService');

const ENTITY_TYPE = 'pla_opening_balance';

module.exports = {
  get: async (event, company_id) => {
    return await plaOpeningBalanceService.get(company_id);
  },
  save: async (event, data) => {
    let before = null;
    try {
      const snap = await plaOpeningBalanceService.get(data.company_id);
      if (snap && snap.success && snap.exists) before = snap.data;
    } catch (err) {
      console.error('Error fetching PLA opening balance snapshot before:', err);
    }
    const result = await plaOpeningBalanceService.save(data);
    if (result && result.success) {
      try {
        const afterSnap = await plaOpeningBalanceService.get(data.company_id);
        const after = (afterSnap && afterSnap.success) ? afterSnap.data : null;
        await auditTrailService.record({
          company_id: data.company_id,
          entity_type: ENTITY_TYPE,
          entity_id: data.company_id,
          action: before ? 'update' : 'create',
          before,
          after,
        });
      } catch (err) {
        console.error('Error recording PLA opening balance audit:', err);
      }
    }
    return result;
  },
};
