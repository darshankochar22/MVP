const exciseOpeningBalanceService = require('./exciseOpeningBalanceService');
const auditTrailService = require('../auditTrail/auditTrailService');

const ENTITY_TYPE = 'excise_opening_balance';

module.exports = {
  get: async (event, company_id) => {
    return await exciseOpeningBalanceService.get(company_id);
  },
  save: async (event, data) => {
    let before = null;
    try {
      const snap = await exciseOpeningBalanceService.get(data.company_id);
      if (snap && snap.success && snap.exists) before = snap.data;
    } catch (err) {
      console.error('Error fetching excise opening balance snapshot before:', err);
    }
    const result = await exciseOpeningBalanceService.save(data);
    if (result && result.success) {
      try {
        const afterSnap = await exciseOpeningBalanceService.get(data.company_id);
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
        console.error('Error recording excise opening balance audit:', err);
      }
    }
    return result;
  },
};
