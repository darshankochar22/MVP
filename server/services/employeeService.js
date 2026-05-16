let employees = [];

const employeeCounters = {};

const generateEmployeeCode = (company_id) => {
  if (!employeeCounters[company_id]) employeeCounters[company_id] = 1;
  else employeeCounters[company_id]++;
  return `EMP-${String(employeeCounters[company_id]).padStart(5, '0')}`;
};

module.exports = {
  create: async (data) => {
    try {
      if (data.employee_code) {
        const exists = employees.find(
          e => e.company_id === data.company_id &&
          e.employee_code === data.employee_code
        );
        if (exists) return { success: false, error: 'Employee code already exists' };
      }

      const employee = {
        id: Date.now(),
        company_id: data.company_id,
        employee_group_id: data.employee_group_id || null,
        name: data.name,
        employee_code: data.employee_code || generateEmployeeCode(data.company_id),
        designation: data.designation || null,
        department: data.department || null,
        date_of_joining: data.date_of_joining || null,
        date_of_leaving: data.date_of_leaving || null,
        mobile: data.mobile || null,
        email: data.email || null,
        bank_account_number: data.bank_account_number || null,
        ifsc_code: data.ifsc_code || null,
        pan: data.pan || null,
        aadhaar: data.aadhaar || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      employees.push(employee);
      return { success: true, employee };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = employees.filter(
        e => e.company_id === company_id && e.is_active
      );
      return { success: true, employees: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const employee = employees.find(e => e.id === id);
      if (!employee) return { success: false, error: 'Employee not found' };
      return { success: true, employee };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getByGroup: async (company_id, employee_group_id) => {
    try {
      const result = employees.filter(
        e => e.company_id === company_id &&
        e.employee_group_id === employee_group_id &&
        e.is_active
      );
      return { success: true, employees: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const index = employees.findIndex(e => e.id === data.id);
      if (index === -1) return { success: false, error: 'Employee not found' };

      if (data.employee_code && data.employee_code !== employees[index].employee_code) {
        const exists = employees.find(
          e => e.company_id === employees[index].company_id &&
          e.employee_code === data.employee_code
        );
        if (exists) return { success: false, error: 'Employee code already exists' };
      }

      employees[index] = {
        ...employees[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return { success: true, employee: employees[index] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const employee = employees.find(e => e.id === id);
      if (!employee) return { success: false, error: 'Employee not found' };

      employees = employees.map(e =>
        e.id === id ? {
          ...e,
          is_active: false,
          date_of_leaving: e.date_of_leaving || new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        } : e
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};