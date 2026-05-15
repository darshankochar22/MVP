let stockGroups = [];

const buildTree = (all, parentId = null) => {
  return all
    .filter(g => g.parent_group_id === parentId)
    .map(g => ({ ...g, children: buildTree(all, g.id) }));
};

const seedDefaultStockGroups = (company_id) => {
  const defaults = [
    { name: 'Primary',        is_primary: true,  parent_group_id: null },
    { name: 'All Items',      is_primary: false, parent_group_id: null },
  ];

  defaults.forEach((g, i) => {
    stockGroups.push({
      id: Date.now() + i,
      company_id,
      name: g.name,
      alias: null,
      parent_group_id: g.parent_group_id,
      should_quantities_be_added: true,
      hsn_sac_code: null,
      hsn_sac_description: null,
      gst_rate: 0,
      cgst_rate: 0,
      sgst_rate: 0,
      statutory_details: null,
      is_primary: g.is_primary,
      is_active: true,
      is_predefined: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });
};

module.exports = {
  seedDefaultStockGroups,

  create: async (data) => {
    try {
      const exists = stockGroups.find(
        g => g.company_id === data.company_id &&
        g.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) return { success: false, error: 'Stock Group already exists' };

      const group = {
        id: Date.now(),
        company_id: data.company_id,
        name: data.name,
        alias: data.alias || null,
        parent_group_id: data.parent_group_id || null,
        should_quantities_be_added: data.should_quantities_be_added ?? true,
        hsn_sac_code: data.hsn_sac_code || null,
        hsn_sac_description: data.hsn_sac_description || null,
        gst_rate: data.gst_rate || 0,
        cgst_rate: data.cgst_rate || 0,
        sgst_rate: data.sgst_rate || 0,
        statutory_details: data.statutory_details || null,
        is_primary: false,
        is_active: true,
        is_predefined: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      stockGroups.push(group);
      return { success: true, group };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = stockGroups.filter(g => g.company_id === company_id && g.is_active);
      return { success: true, stockGroups: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const group = stockGroups.find(g => g.id === id);
      if (!group) return { success: false, error: 'Stock Group not found' };
      return { success: true, group };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getTree: async (company_id) => {
    try {
      const all = stockGroups.filter(g => g.company_id === company_id && g.is_active);
      const tree = buildTree(all);
      return { success: true, tree };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const index = stockGroups.findIndex(g => g.id === data.id);
      if (index === -1) return { success: false, error: 'Stock Group not found' };
      if (stockGroups[index].is_predefined) return { success: false, error: 'Cannot edit predefined stock groups' };

      stockGroups[index] = { ...stockGroups[index], ...data, updated_at: new Date().toISOString() };
      return { success: true, group: stockGroups[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const group = stockGroups.find(g => g.id === id);
      if (!group) return { success: false, error: 'Stock Group not found' };
      if (group.is_predefined) return { success: false, error: 'Cannot delete predefined stock groups' };

      const hasChildren = stockGroups.some(g => g.parent_group_id === id);
      if (hasChildren) return { success: false, error: 'Cannot delete Stock Group with subgroups' };

      stockGroups = stockGroups.map(g => g.id === id ? { ...g, is_active: false } : g);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};