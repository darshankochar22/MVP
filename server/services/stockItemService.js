let stockItems = [];

module.exports = {
  create: async (data) => {
    try {
      const exists = stockItems.find(
        i => i.company_id === data.company_id &&
        i.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) return { success: false, error: 'Stock Item already exists' };

      const item = {
        id: Date.now(),
        company_id: data.company_id,
        name: data.name,
        alias: data.alias || null,
        group_id: data.group_id || null,
        category_id: data.category_id || null,
        unit_id: data.unit_id || null,
        gst_applicablee: data.gst_applicablee || 'Not Applicable',
        hsn_code: data.hsn_code || null,
        sac_code: data.sac_code || null,
        gst_rate: data.gst_rate || 0,
        cgst_rate: data.cgst_rate || 0,
        sgst_rate: data.sgst_rate || 0,
        igst_rate: data.igst_rate || 0,
        type_of_supply: data.type_of_supply || 'Goods',
        rate_of_duty: data.rate_of_duty || 0,
        statutory_details: data.statutory_details || null,
        opening_quantity: data.opening_quantity || 0,
        opening_rate: data.opening_rate || 0,
        opening_value: data.opening_value || 0,
        reorder_level: data.reorder_level || 0,
        reorder_quantity: data.reorder_quantity || 0,
        track_batches: data.track_batches || false,
        track_expiry: data.track_expiry || false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      stockItems.push(item);
      return { success: true, item };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = stockItems.filter(i => i.company_id === company_id && i.is_active);
      return { success: true, stockItems: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const item = stockItems.find(i => i.id === id);
      if (!item) return { success: false, error: 'Stock Item not found' };
      return { success: true, item };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getByGroup: async (company_id, group_id) => {
    try {
      const result = stockItems.filter(
        i => i.company_id === company_id && i.group_id === group_id && i.is_active
      );
      return { success: true, stockItems: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getByCategory: async (company_id, category_id) => {
    try {
      const result = stockItems.filter(
        i => i.company_id === company_id && i.category_id === category_id && i.is_active
      );
      return { success: true, stockItems: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const index = stockItems.findIndex(i => i.id === data.id);
      if (index === -1) return { success: false, error: 'Stock Item not found' };

      if (data.opening_quantity || data.opening_rate) {
        const qty = data.opening_quantity ?? stockItems[index].opening_quantity;
        const rate = data.opening_rate ?? stockItems[index].opening_rate;
        data.opening_value = qty * rate;
      }

      stockItems[index] = { ...stockItems[index], ...data, updated_at: new Date().toISOString() };
      return { success: true, item: stockItems[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const item = stockItems.find(i => i.id === id);
      if (!item) return { success: false, error: 'Stock Item not found' };

      stockItems = stockItems.map(i => i.id === id ? { ...i, is_active: false } : i);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};