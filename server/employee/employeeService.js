const { db } = require('../db/index');

const generateEmployeeCode = async (company_id) => {
  const result = await db.execute(
    `SELECT COUNT(*) as count FROM employees WHERE company_id = ?`,
    [company_id]
  );
  const count = Number(result.rows[0].count) + 1;
  return `EMP-${String(count).padStart(5, '0')}`;
};

module.exports = {
  create: async (data) => {
    try {
      if (data.employee_code) {
        const exists = await db.execute(
          `SELECT * FROM employees WHERE company_id = ? AND employee_code = ? AND is_active = 1`,
          [data.company_id, data.employee_code]
        );
        if (exists.rows.length > 0) return { success: false, error: 'Employee code already exists' };
      }

      const employee_code = data.employee_code || await generateEmployeeCode(data.company_id);

      const result = await db.execute(
        `INSERT INTO employees (
          company_id, employee_group_id, name, alias, employee_code,
          designation, department, function, location,
          date_of_joining, date_of_leaving, date_of_birth, gender, blood_group,
          father_name, mother_name, spouse_name,
          address, city, state, pincode,
          mobile, phone, email, define_salary_details,
          bank_account_number, bank_name, bank_branch, ifsc_code,
          applicable_tax_regime, pan, aadhaar, uan,
          pf_account_number, eps_account_number, date_of_joining_pf, pran,
          esi_number, esi_dispensary_name,
          is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          data.company_id,
          data.employee_group_id || null,
          data.name,
          data.alias || null,
          employee_code,
          data.designation || null,
          data.department || null,
          data.function || null,
          data.location || null,
          data.date_of_joining || null,
          data.date_of_leaving || null,
          data.date_of_birth || null,
          data.gender || null,
          data.blood_group || null,
          data.father_name || null,
          data.mother_name || null,
          data.spouse_name || null,
          data.address || null,
          data.city || null,
          data.state || null,
          data.pincode || null,
          data.mobile || null,
          data.phone || null,
          data.email || null,
          data.define_salary_details ?? 0,
          data.bank_account_number || null,
          data.bank_name || null,
          data.bank_branch || null,
          data.ifsc_code || null,
          data.applicable_tax_regime || null,
          data.pan || null,
          data.aadhaar || null,
          data.uan || null,
          data.pf_account_number || null,
          data.eps_account_number || null,
          data.date_of_joining_pf || null,
          data.pran || null,
          data.esi_number || null,
          data.esi_dispensary_name || null,
        ]
      );

      const employee = await db.execute(
        `SELECT * FROM employees WHERE employee_id = ?`,
        [result.lastInsertRowid]
      );
      return { success: true, employee: employee.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM employees WHERE company_id = ? AND is_active = 1`,
        [company_id]
      );
      return { success: true, employees: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM employees WHERE employee_id = ?`,
        [id]
      );
      if (result.rows.length === 0) return { success: false, error: 'Employee not found' };
      return { success: true, employee: result.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getByGroup: async (company_id, employee_group_id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM employees WHERE company_id = ? AND employee_group_id = ? AND is_active = 1`,
        [company_id, employee_group_id]
      );
      return { success: true, employees: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const existing = await db.execute(
        `SELECT * FROM employees WHERE employee_id = ?`,
        [data.employee_id]
      );
      if (existing.rows.length === 0) return { success: false, error: 'Employee not found' };

      const current = existing.rows[0];

      if (data.employee_code && data.employee_code !== current.employee_code) {
        const codeExists = await db.execute(
          `SELECT * FROM employees WHERE company_id = ? AND employee_code = ? AND is_active = 1`,
          [current.company_id, data.employee_code]
        );
        if (codeExists.rows.length > 0) return { success: false, error: 'Employee code already exists' };
      }

      await db.execute(
        `UPDATE employees SET
          employee_group_id = ?, name = ?, alias = ?, employee_code = ?,
          designation = ?, department = ?, function = ?, location = ?,
          date_of_joining = ?, date_of_leaving = ?, date_of_birth = ?,
          gender = ?, blood_group = ?,
          father_name = ?, mother_name = ?, spouse_name = ?,
          address = ?, city = ?, state = ?, pincode = ?,
          mobile = ?, phone = ?, email = ?, define_salary_details = ?,
          bank_account_number = ?, bank_name = ?, bank_branch = ?, ifsc_code = ?,
          applicable_tax_regime = ?, pan = ?, aadhaar = ?, uan = ?,
          pf_account_number = ?, eps_account_number = ?, date_of_joining_pf = ?, pran = ?,
          esi_number = ?, esi_dispensary_name = ?,
          updated_at = datetime('now')
         WHERE employee_id = ?`,
        [
          data.employee_group_id ?? current.employee_group_id,
          data.name ?? current.name,
          data.alias ?? current.alias,
          data.employee_code ?? current.employee_code,
          data.designation ?? current.designation,
          data.department ?? current.department,
          data.function ?? current.function,
          data.location ?? current.location,
          data.date_of_joining ?? current.date_of_joining,
          data.date_of_leaving ?? current.date_of_leaving,
          data.date_of_birth ?? current.date_of_birth,
          data.gender ?? current.gender,
          data.blood_group ?? current.blood_group,
          data.father_name ?? current.father_name,
          data.mother_name ?? current.mother_name,
          data.spouse_name ?? current.spouse_name,
          data.address ?? current.address,
          data.city ?? current.city,
          data.state ?? current.state,
          data.pincode ?? current.pincode,
          data.mobile ?? current.mobile,
          data.phone ?? current.phone,
          data.email ?? current.email,
          data.define_salary_details ?? current.define_salary_details,
          data.bank_account_number ?? current.bank_account_number,
          data.bank_name ?? current.bank_name,
          data.bank_branch ?? current.bank_branch,
          data.ifsc_code ?? current.ifsc_code,
          data.applicable_tax_regime ?? current.applicable_tax_regime,
          data.pan ?? current.pan,
          data.aadhaar ?? current.aadhaar,
          data.uan ?? current.uan,
          data.pf_account_number ?? current.pf_account_number,
          data.eps_account_number ?? current.eps_account_number,
          data.date_of_joining_pf ?? current.date_of_joining_pf,
          data.pran ?? current.pran,
          data.esi_number ?? current.esi_number,
          data.esi_dispensary_name ?? current.esi_dispensary_name,
          data.employee_id,
        ]
      );

      const updated = await db.execute(
        `SELECT * FROM employees WHERE employee_id = ?`,
        [data.employee_id]
      );
      return { success: true, employee: updated.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const existing = await db.execute(
        `SELECT * FROM employees WHERE employee_id = ?`,
        [id]
      );
      if (existing.rows.length === 0) return { success: false, error: 'Employee not found' };

      const current = existing.rows[0];
      await db.execute(
        `UPDATE employees SET
          is_active = 0,
          date_of_leaving = ?,
          updated_at = datetime('now')
         WHERE employee_id = ?`,
        [
          current.date_of_leaving || new Date().toISOString().split('T')[0],
          id,
        ]
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};