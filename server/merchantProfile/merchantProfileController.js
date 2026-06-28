const merchantProfileService = require('./merchantProfileService');
const auditTrailService = require('../auditTrail/auditTrailService');

const ENTITY_TYPE = 'merchant_profile';

module.exports = {
  create: async (event, data) => {
    const result = await merchantProfileService.create(data);
    if (result && result.success && result.profile) {
      try {
        await auditTrailService.record({
          company_id: result.profile.company_id,
          entity_type: ENTITY_TYPE,
          entity_id: result.profile.merchant_profile_id,
          action: 'create',
          before: null,
          after: result.profile,
        });
      } catch (err) {
        console.error('Error recording merchant profile create audit:', err);
      }
    }
    return result;
  },

  getAll: async (event, company_id) => {
    return await merchantProfileService.getAll(company_id);
  },

  getById: async (event, id) => {
    return await merchantProfileService.getById(id);
  },

  update: async (event, data) => {
    let before = null;
    try {
      const snap = await merchantProfileService.getById(data.merchant_profile_id);
      if (snap && snap.success) before = snap.profile;
    } catch (err) {
      console.error('Error fetching merchant profile update snapshot:', err);
    }
    const result = await merchantProfileService.update(data);
    if (result && result.success && result.profile) {
      try {
        await auditTrailService.record({
          company_id: result.profile.company_id,
          entity_type: ENTITY_TYPE,
          entity_id: result.profile.merchant_profile_id,
          action: 'update',
          before,
          after: result.profile,
        });
      } catch (err) {
        console.error('Error recording merchant profile update audit:', err);
      }
    }
    return result;
  },

  delete: async (event, id) => {
    let before = null;
    try {
      const snap = await merchantProfileService.getById(id);
      if (snap && snap.success) before = snap.profile;
    } catch (err) {
      console.error('Error fetching merchant profile delete snapshot:', err);
    }
    const result = await merchantProfileService.delete(id);
    if (result && result.success && before) {
      try {
        await auditTrailService.record({
          company_id: before.company_id,
          entity_type: ENTITY_TYPE,
          entity_id: before.merchant_profile_id,
          action: 'delete',
          before,
          after: null,
        });
      } catch (err) {
        console.error('Error recording merchant profile delete audit:', err);
      }
    }
    return result;
  },
};
