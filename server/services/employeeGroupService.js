let employeeGroups = [];

const buildTree = (all, parentId = null) => {
  return all
    .filter(g => g.parent_group_id === parentId)
    .map(g => ({ ...g, children: buildTree(all, g.id) }));
};

const seedDefaultEmployeeGroups = (company_id) => {
  const defaults = [
    { name: 'Primary',      parent_group_id: null },
    { name: 'Management',   parent_group_id: null },
    { name: 'Staff',        parent_group_id: null },
    { name: 'Workers',      parent_group_id: null },
  ];

  defaults.forEach((g, i) => {
    employeeGroups.push({
      id: Date.now() + i,
      company_id,
      name: g.name,
      alias: null,
      parent_group_id: g.parent_group_id,
      is_active: true,
      is_predefined: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });
};

module.exports = {
  seedDefaultEmployeeGroups,

  create: async (data) => {
    try {
      const exists = employeeGroups.find(
        g => g.company_id === data.company_id &&
        g.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) return { success: false, error: 'Employee Group already exists' };

      const group = {
        id: Date.now(),
        company_id: data.company_id,
        name: data.name,
        alias: data.alias || null,
        parent_group_id: data.parent_group_id || null,
        is_active: true,
        is_predefined: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      employeeGroups.push(group);
      return { success: true, group };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = employeeGroups.filter(
        g => g.company_id === company_id && g.is_active
      );
      return { success: true, employeeGroups: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const group = employeeGroups.find(g => g.id === id);
      if (!group) return { success: false, error: 'Employee Group not found' };
      return { success: true, group };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getTree: async (company_id) => {
    try {
      const all = employeeGroups.filter(
        g => g.company_id === company_id && g.is_active
      );
      const tree = buildTree(all);
      return { success: true, tree };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const index = employeeGroups.findIndex(g => g.id === data.id);
      if (index === -1) return { success: false, error: 'Employee Group not found' };
      if (employeeGroups[index].is_predefined) return { success: false, error: 'Cannot edit predefined employee groups' };

      employeeGroups[index] = {
        ...employeeGroups[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return { success: true, group: employeeGroups[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const group = employeeGroups.find(g => g.id === id);
      if (!group) return { success: false, error: 'Employee Group not found' };
      if (group.is_predefined) return { success: false, error: 'Cannot delete predefined employee groups' };

      const hasChildren = employeeGroups.some(g => g.parent_group_id === id);
      if (hasChildren) return { success: false, error: 'Cannot delete group with sub-groups' };

      const hasEmployees = employeeGroups.some(g => g.employee_group_id === id);
      if (hasEmployees) return { success: false, error: 'Cannot delete group with employees' };

      employeeGroups = employeeGroups.map(g =>
        g.id === id ? { ...g, is_active: false } : g
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};