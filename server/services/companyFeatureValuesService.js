let companyFeatureValues = [];

const seedCompanyFeatureValues = (company_id) => {
  const { featureItems } = require('./featureItemService').getAll();

  const defaultValues = [
    { feature_item_id: 1,  value_boolean: true,  is_enabled: true  }, 
    { feature_item_id: 2,  value_boolean: false, is_enabled: false }, 
    { feature_item_id: 3,  value_boolean: false, is_enabled: false },
    { feature_item_id: 4,  value_boolean: true,  is_enabled: true  }, 
    { feature_item_id: 5,  value_boolean: true,  is_enabled: true  }, 
    { feature_item_id: 6,  value_boolean: false, is_enabled: false }, 
    { feature_item_id: 7,  value_boolean: false, is_enabled: false }, 
    { feature_item_id: 8,  value_boolean: false, is_enabled: false }, 
    { feature_item_id: 9,  value_boolean: false, is_enabled: false }, 
    { feature_item_id: 10, value_boolean: false, is_enabled: false }, 
    { feature_item_id: 11, value_boolean: false, is_enabled: false }, 
    { feature_item_id: 12, value_boolean: false, is_enabled: false }, 
    { feature_item_id: 13, value_boolean: false, is_enabled: false }, 
    { feature_item_id: 14, value_boolean: false, is_enabled: false }, 
    { feature_item_id: 15, value_boolean: false, is_enabled: false },
    { feature_item_id: 16, value_boolean: false, is_enabled: false }, 
    { feature_item_id: 17, value_boolean: false, is_enabled: false }, 
    { feature_item_id: 18, value_boolean: false, is_enabled: false }, 
    { feature_item_id: 19, value_boolean: false, is_enabled: false }, 
  ];

  defaultValues.forEach((v, i) => {
    companyFeatureValues.push({
      id: Date.now() + i,
      company_id,
      feature_item_id: v.feature_item_id,
      value_boolean: v.value_boolean,
      value_text: null,
      value_number: null,
      value_date: null,
      is_enabled: v.is_enabled,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });
};

module.exports = {
  seedCompanyFeatureValues,

  get: async (company_id) => {
    try {
      const values = companyFeatureValues.filter(v => v.company_id === company_id);
      if (!values.length) return { success: false, error: 'No feature values found' };
      return { success: true, values };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getByGroup: async (company_id, group_id) => {
    try {
      const { featureItems } = require('./featureItemService');
      const groupItemIds = featureItems
        .filter(f => f.group_id === group_id)
        .map(f => f.id);

      const values = companyFeatureValues.filter(
        v => v.company_id === company_id &&
        groupItemIds.includes(v.feature_item_id)
      );
      return { success: true, values };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const index = companyFeatureValues.findIndex(
        v => v.company_id === data.company_id &&
        v.feature_item_id === data.feature_item_id
      );
      if (index === -1) return { success: false, error: 'Feature value not found' };

      companyFeatureValues[index] = {
        ...companyFeatureValues[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return { success: true, value: companyFeatureValues[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  updateBulk: async (company_id, values) => {
    try {
      const updated = [];

      values.forEach(v => {
        const index = companyFeatureValues.findIndex(
          f => f.company_id === company_id &&
          f.feature_item_id === v.feature_item_id
        );
        if (index !== -1) {
          companyFeatureValues[index] = {
            ...companyFeatureValues[index],
            ...v,
            updated_at: new Date().toISOString(),
          };
          updated.push(companyFeatureValues[index]);
        }
      });

      return { success: true, updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};