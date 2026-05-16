
const featureGroups = [
  {
    id: 1,
    group_key: 'accounts',
    group_name: 'Accounting Features',
    online_access: false,
    display_order: 1,
    is_active: true,
  },
  {
    id: 2,
    group_key: 'inventory',
    group_name: 'Inventory Features',
    online_access: false,
    display_order: 2,
    is_active: true,
  },
  {
    id: 3,
    group_key: 'gst',
    group_name: 'GST & Statutory Features',
    online_access: false,
    display_order: 3,
    is_active: true,
  },
  {
    id: 4,
    group_key: 'payroll',
    group_name: 'Payroll Features',
    online_access: false,
    display_order: 4,
    is_active: true,
  },
  {
    id: 5,
    group_key: 'banking',
    group_name: 'Banking Features',
    online_access: false,
    display_order: 5,
    is_active: true,
  },
  {
    id: 6,
    group_key: 'online',
    group_name: 'Online & Connected Features',
    online_access: true,
    display_order: 6,
    is_active: true,
  },
];

module.exports = {
  getAll: async () => {
    try {
      return { success: true, featureGroups };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const group = featureGroups.find(g => g.id === id);
      if (!group) return { success: false, error: 'Feature Group not found' };
      return { success: true, group };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};