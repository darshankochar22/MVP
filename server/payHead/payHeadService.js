const { db } = require('../db/index');

const seedDefaultPayHeads = async (company_id) => {
  const defaults = [
    { name: 'Basic Salary',         pay_head_type: 'Earnings',                      calculation_type: 'Flat Rate',  affects_net_salary: 1, under_group: 'Indirect Expenses',   statutory_component: null,       percentage_or_amount: 0     },
    { name: 'House Rent Allowance', pay_head_type: 'Earnings',                      calculation_type: 'Percentage', affects_net_salary: 1, under_group: 'Indirect Expenses',   statutory_component: null,       percentage_or_amount: 40    },
    { name: 'Conveyance Allowance', pay_head_type: 'Earnings',                      calculation_type: 'Flat Rate',  affects_net_salary: 1, under_group: 'Indirect Expenses',   statutory_component: null,       percentage_or_amount: 0     },
    { name: 'Provident Fund',       pay_head_type: 'Deductions',                    calculation_type: 'Percentage', affects_net_salary: 1, under_group: 'Current Liabilities', statutory_component: 'PF',       percentage_or_amount: 12    },
    { name: 'Professional Tax',     pay_head_type: 'Deductions',                    calculation_type: 'Flat Rate',  affects_net_salary: 1, under_group: 'Current Liabilities', statutory_component: 'PT',       percentage_or_amount: 0     },
    { name: 'TDS',                  pay_head_type: 'Deductions',                    calculation_type: 'Percentage', affects_net_salary: 1, under_group: 'Current Liabilities', statutory_component: 'TDS',      percentage_or_amount: 0     },
    { name: 'ESI',                  pay_head_type: 'Deductions',                    calculation_type: 'Percentage', affects_net_salary: 1, under_group: 'Current Liabilities', statutory_component: 'ESI',      percentage_or_amount: 0.75  },
    { name: 'Gratuity',             pay_head_type: 'Employer Statutory Contributions', calculation_type: 'Percentage', affects_net_salary: 0, under_group: 'Indirect Expenses', statutory_component: 'Gratuity', percentage_or_amount: 4.81  },
  ];

  for (const p of defaults) {
    await db.execute(
      `INSERT INTO pay_heads (
        company_id, name, pay_head_type, calculation_type,
        affects_net_salary, under_group, statutory_component,
        percentage_or_amount, is_active, is_predefined
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
      [
        company_id, p.name, p.pay_head_type, p.calculation_type,
        p.affects_net_salary, p.under_group, p.statutory_component,
        p.percentage_or_amount,
      ]
    );
  }
};

module.exports = {
  seedDefaultPayHeads,

  create: async (data) => {
    try {
      const exists = await db.execute(
        `SELECT * FROM pay_heads WHERE company_id = ? AND LOWER(name) = LOWER(?) AND is_active = 1`,
        [data.company_id, data.name]
      );
      if (exists.rows.length > 0) return { success: false, error: 'Pay Head already exists' };

      const result = await db.execute(
        `INSERT INTO pay_heads (
          company_id, name, alias, pay_head_type, income_type,
          under_group, affects_net_salary, payslip_display_name,
          use_for_gratuity, set_alter_income_tax,
          calculation_type, calculation_period,
          rounding_method, rounding_limit,
          statutory_component, percentage_or_amount,
          is_active, is_predefined
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
        [
          data.company_id,
          data.name,
          data.alias || null,
          data.pay_head_type || 'Earnings for Employees',
          data.income_type || 'Fixed',
          data.under_group || null,
          data.affects_net_salary ?? 1,
          data.payslip_display_name || null,
          data.use_for_gratuity ?? 0,
          data.set_alter_income_tax ?? 0,
          data.calculation_type || 'As User Defined Value',
          data.calculation_period || 'Months',
          data.rounding_method || 'Not Applicable',
          data.rounding_limit || 0,
          data.statutory_component || null,
          data.percentage_or_amount || 0,
        ]
      );

      const payHead = await db.execute(
        `SELECT * FROM pay_heads WHERE pay_head_id = ?`,
        [result.lastInsertRowid]
      );
      return { success: true, payHead: payHead.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM pay_heads WHERE company_id = ? AND is_active = 1`,
        [company_id]
      );
      return { success: true, payHeads: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM pay_heads WHERE pay_head_id = ?`,
        [id]
      );
      if (result.rows.length === 0) return { success: false, error: 'Pay Head not found' };
      return { success: true, payHead: result.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const existing = await db.execute(
        `SELECT * FROM pay_heads WHERE pay_head_id = ?`,
        [data.pay_head_id]
      );
      if (existing.rows.length === 0) return { success: false, error: 'Pay Head not found' };
      if (existing.rows[0].is_predefined) return { success: false, error: 'Cannot edit predefined pay heads' };

      const current = existing.rows[0];
      await db.execute(
        `UPDATE pay_heads SET
          name = ?, alias = ?, pay_head_type = ?, income_type = ?,
          under_group = ?, affects_net_salary = ?, payslip_display_name = ?,
          use_for_gratuity = ?, set_alter_income_tax = ?,
          calculation_type = ?, calculation_period = ?,
          rounding_method = ?, rounding_limit = ?,
          statutory_component = ?, percentage_or_amount = ?,
          updated_at = datetime('now')
         WHERE pay_head_id = ?`,
        [
          data.name ?? current.name,
          data.alias ?? current.alias,
          data.pay_head_type ?? current.pay_head_type,
          data.income_type ?? current.income_type,
          data.under_group ?? current.under_group,
          data.affects_net_salary ?? current.affects_net_salary,
          data.payslip_display_name ?? current.payslip_display_name,
          data.use_for_gratuity ?? current.use_for_gratuity,
          data.set_alter_income_tax ?? current.set_alter_income_tax,
          data.calculation_type ?? current.calculation_type,
          data.calculation_period ?? current.calculation_period,
          data.rounding_method ?? current.rounding_method,
          data.rounding_limit ?? current.rounding_limit,
          data.statutory_component ?? current.statutory_component,
          data.percentage_or_amount ?? current.percentage_or_amount,
          data.pay_head_id,
        ]
      );

      const updated = await db.execute(
        `SELECT * FROM pay_heads WHERE pay_head_id = ?`,
        [data.pay_head_id]
      );
      return { success: true, payHead: updated.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const existing = await db.execute(
        `SELECT * FROM pay_heads WHERE pay_head_id = ?`,
        [id]
      );
      if (existing.rows.length === 0) return { success: false, error: 'Pay Head not found' };
      if (existing.rows[0].is_predefined) return { success: false, error: 'Cannot delete predefined pay heads' };

      await db.execute(
        `UPDATE pay_heads SET is_active = 0 WHERE pay_head_id = ?`,
        [id]
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getSlabs: async (pay_head_id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM pay_head_slab_lines WHERE pay_head_id = ? ORDER BY effective_from`,
        [pay_head_id]
      );
      return { success: true, slabs: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  createSlab: async (data) => {
    try {
      const result = await db.execute(
        `INSERT INTO pay_head_slab_lines (pay_head_id, effective_from, amount_gt, amount_up_to, slab_type, value)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.pay_head_id, data.effective_from || null, data.amount_gt || 0, data.amount_up_to || 0, data.slab_type || null, data.value || 0]
      );
      const slab = await db.execute(`SELECT * FROM pay_head_slab_lines WHERE slab_line_id = ?`, [result.lastInsertRowid]);
      return { success: true, slab: slab.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  deleteSlab: async (id) => {
    try {
      await db.execute(`DELETE FROM pay_head_slab_lines WHERE slab_line_id = ?`, [id]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getFormulas: async (pay_head_id) => {
    try {
      const result = await db.execute(
        `SELECT fl.*, ph.name as pay_head_name FROM pay_head_formula_lines fl
         LEFT JOIN pay_heads ph ON fl.pay_head_id_ref = ph.pay_head_id
         WHERE fl.pay_head_id = ? ORDER BY fl.sequence`,
        [pay_head_id]
      );
      return { success: true, formulas: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  createFormula: async (data) => {
    try {
      const result = await db.execute(
        `INSERT INTO pay_head_formula_lines (pay_head_id, sequence, function, pay_head_id_ref, operator)
         VALUES (?, ?, ?, ?, ?)`,
        [data.pay_head_id, data.sequence || 0, data.function || null, data.pay_head_id_ref || null, data.operator || null]
      );
      const formula = await db.execute(`SELECT * FROM pay_head_formula_lines WHERE formula_line_id = ?`, [result.lastInsertRowid]);
      return { success: true, formula: formula.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  deleteFormula: async (id) => {
    try {
      await db.execute(`DELETE FROM pay_head_formula_lines WHERE formula_line_id = ?`, [id]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};