const { db } = require('../db/index');

module.exports = {
  seedDefaultFY: async (company_id, financial_year_beginning_from) => {
    try {
      if (!financial_year_beginning_from) return;

      const start = new Date(financial_year_beginning_from);
      const startDate = start.toISOString().split('T')[0];

      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      end.setDate(end.getDate() - 1);
      const endDate = end.toISOString().split('T')[0];

      await db.execute(
        `INSERT INTO financial_years (company_id, start_date, end_date, is_active, is_closed, closing_date)
         VALUES (?, ?, ?, 1, 0, null)`,
        [company_id, startDate, endDate]
      );
    } catch (err) {
      console.error('seedDefaultFY error:', err.message);
    }
  },

  create: async (data) => {
    try {
      const existing = await db.execute(
        `SELECT * FROM financial_years WHERE company_id = ? AND start_date = ?`,
        [data.company_id, data.start_date]
      );
      if (existing.rows.length > 0) return { success: false, error: 'Financial year already exists' };

      const start = new Date(data.start_date);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 1);
      end.setDate(end.getDate() - 1);

      const result = await db.execute(
        `INSERT INTO financial_years (company_id, start_date, end_date, is_active, is_closed, closing_date)
         VALUES (?, ?, ?, ?, 0, null)`,
        [
          data.company_id,
          data.start_date,
          data.end_date || end.toISOString().split('T')[0],
          0,
        ]
      );

      const fy = await db.execute(
        `SELECT * FROM financial_years WHERE fy_id = ?`,
        [result.lastInsertRowid]
      );
      return { success: true, fy: fy.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    console.log(' getAll called with:', company_id, typeof company_id);
    try {
      const result = await db.execute(
        `SELECT * FROM financial_years WHERE company_id = ?`,
        [company_id]
      );
      return { success: true, financialYears: result.rows };
    } catch (err) {
      console.log('getAll error:', err.message);
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM financial_years WHERE fy_id = ?`,
        [id]
      );
      if (result.rows.length === 0) return { success: false, error: 'Financial year not found' };
      return { success: true, fy: result.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  setActive: async (fy_id, company_id) => {
    try {
      const fy = await db.execute(
        `SELECT * FROM financial_years WHERE fy_id = ?`,
        [fy_id]
      );
      if (fy.rows.length === 0) return { success: false, error: 'Financial year not found' };
      if (fy.rows[0].is_closed) return { success: false, error: 'Cannot activate a closed financial year' };

      await db.execute(
        `UPDATE financial_years SET is_active = 0 WHERE company_id = ?`,
        [company_id]
      );
      await db.execute(
        `UPDATE financial_years SET is_active = 1 WHERE fy_id = ?`,
        [fy_id]
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM financial_years WHERE fy_id = ?`,
        [id]
      );
      if (result.rows.length === 0) return { success: false, error: 'Financial year not found' };
      const fy = result.rows[0];
      if (fy.is_active) return { success: false, error: 'Cannot delete active financial year' };
      if (fy.is_closed) return { success: false, error: 'Cannot delete closed financial year' };

      await db.execute(`DELETE FROM financial_years WHERE fy_id = ?`, [id]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};