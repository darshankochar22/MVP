let payrollUnits = [];

const seedDefaultPayrollUnits = (company_id) => {
  const defaults = [
    { name: 'Days',    symbol: 'Days', unit_type: 'Simple',   decimal_places: 0 },
    { name: 'Hours',   symbol: 'Hrs',  unit_type: 'Simple',   decimal_places: 2 },
    { name: 'Minutes', symbol: 'Min',  unit_type: 'Simple',   decimal_places: 0 },
    { name: 'Months',  symbol: 'Mth',  unit_type: 'Simple',   decimal_places: 0 },
    { name: 'Pieces',  symbol: 'Pcs',  unit_type: 'Simple',   decimal_places: 0 },
  ];

  defaults.forEach((u, i) => {
    payrollUnits.push({
      id: Date.now() + i,
      company_id,
      name: u.name,
      symbol: u.symbol,
      unit_type: u.unit_type,
      decimal_places: u.decimal_places,
      is_active: true,
      is_predefined: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });
};

module.exports = {
  seedDefaultPayrollUnits,

  create: async (data) => {
    try {
      const exists = payrollUnits.find(
        u => u.company_id === data.company_id &&
        u.name.toLowerCase() === data.name.toLowerCase()
      );
      if (exists) return { success: false, error: 'Payroll Unit already exists' };

      const unit = {
        id: Date.now(),
        company_id: data.company_id,
        name: data.name,
        symbol: data.symbol,
        unit_type: data.unit_type || 'Simple',
        decimal_places: data.decimal_places ?? 0,
        is_active: true,
        is_predefined: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      payrollUnits.push(unit);
      return { success: true, unit };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = payrollUnits.filter(
        u => u.company_id === company_id && u.is_active
      );
      return { success: true, payrollUnits: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const unit = payrollUnits.find(u => u.id === id);
      if (!unit) return { success: false, error: 'Payroll Unit not found' };
      return { success: true, unit };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const index = payrollUnits.findIndex(u => u.id === data.id);
      if (index === -1) return { success: false, error: 'Payroll Unit not found' };
      if (payrollUnits[index].is_predefined) return { success: false, error: 'Cannot edit predefined payroll units' };

      payrollUnits[index] = {
        ...payrollUnits[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return { success: true, unit: payrollUnits[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const unit = payrollUnits.find(u => u.id === id);
      if (!unit) return { success: false, error: 'Payroll Unit not found' };
      if (unit.is_predefined) return { success: false, error: 'Cannot delete predefined payroll units' };

      payrollUnits = payrollUnits.map(u =>
        u.id === id ? { ...u, is_active: false } : u
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};