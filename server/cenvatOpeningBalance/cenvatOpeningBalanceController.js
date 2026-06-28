const cenvatOpeningBalanceService = require('./cenvatOpeningBalanceService');
const auditTrailService = require('../auditTrail/auditTrailService');

const ENTITY_TYPE = 'cenvat_opening_balance';

module.exports = {
  get: async (event, company_id) => {
    return await cenvatOpeningBalanceService.get(company_id);
  },
  save: async (event, data) => {
    let before = null;
    try {
      const snap = await cenvatOpeningBalanceService.get(data.company_id);
      if (snap && snap.success && snap.exists) before = snap.data;
    } catch (err) {
      console.error('Error fetching CENVAT opening balance snapshot before:', err);
    }
    const result = await cenvatOpeningBalanceService.save(data);
    if (result && result.success) {
      try {
        const afterSnap = await cenvatOpeningBalanceService.get(data.company_id);
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
        console.error('Error recording CENVAT opening balance audit:', err);
      }
    }
    return result;
  },
};
