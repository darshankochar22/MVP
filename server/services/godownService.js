let godowns = [];

const buildTree = (all, parentId = null) => {
  return all
    .filter(g => g.parent_godown_id === parentId)
    .map(g => ({ ...g, children: buildTree(all, g.id) }));
};

const seedDefaultGodowns = (company_id) => {
  godowns.push({
    id: Date.now(),
    company_id,
    name: 'Main Location',
    alias: null,
    parent_godown_id: null,
    address: null,
    city: null,
    state: null,
    pincode: null,
    is_primary: true,
    is_main_location: true,
    allow_storage_of_materials: true,
    is_active: true,
    is_predefined: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
};

module.exports = {
  seedDefaultGodowns,

  create: async (data) => {
    try {
      const exists = godowns.find(
        g => g.company_id === data.company_id &&
        g.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) return { success: false, error: 'Godown already exists' };

      const godown = {
        id: Date.now(),
        company_id: data.company_id,
        name: data.name,
        alias: data.alias || null,
        parent_godown_id: data.parent_godown_id || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        is_primary: data.parent_godown_id ? false : true,
        is_main_location: false,
        allow_storage_of_materials: data.allow_storage_of_materials ?? true,
        is_active: true,
        is_predefined: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      godowns.push(godown);
      return { success: true, godown };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = godowns.filter(g => g.company_id === company_id && g.is_active);
      return { success: true, godowns: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const godown = godowns.find(g => g.id === id);
      if (!godown) return { success: false, error: 'Godown not found' };
      return { success: true, godown };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getTree: async (company_id) => {
    try {
      const all = godowns.filter(g => g.company_id === company_id && g.is_active);
      const tree = buildTree(all);
      return { success: true, tree };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const index = godowns.findIndex(g => g.id === data.id);
      if (index === -1) return { success: false, error: 'Godown not found' };
      if (godowns[index].is_predefined) return { success: false, error: 'Cannot edit Main Location' };

      godowns[index] = { ...godowns[index], ...data, updated_at: new Date().toISOString() };
      return { success: true, godown: godowns[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const godown = godowns.find(g => g.id === id);
      if (!godown) return { success: false, error: 'Godown not found' };
      if (godown.is_predefined) return { success: false, error: 'Cannot delete Main Location' };

      const hasChildren = godowns.some(g => g.parent_godown_id === id);
      if (hasChildren) return { success: false, error: 'Cannot delete Godown with sub-godowns' };

      godowns = godowns.map(g => g.id === id ? { ...g, is_active: false } : g);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};