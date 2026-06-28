const vatRegistrationDetailsService = require('./vatRegistrationDetailsService');
const auditTrailService = require('../auditTrail/auditTrailService');

const ENTITY_TYPE = 'vat_registration_details';

module.exports = {
  get: async (event, company_id) => {
    return await vatRegistrationDetailsService.get(company_id);
  },
  save: async (event, data) => {
    let before = null;
    try {
      const snap = await vatRegistrationDetailsService.get(data.company_id);
      if (snap && snap.success && snap.exists) before = snap.data;
    } catch (err) {
      console.error('Error fetching VAT registration details snapshot before:', err);
    }
    const result = await vatRegistrationDetailsService.save(data);
    if (result && result.success) {
      try {
        const afterSnap = await vatRegistrationDetailsService.get(data.company_id);
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
        console.error('Error recording VAT registration details audit:', err);
      }
    }
    return result;
  },
};
