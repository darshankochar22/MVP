const { db } = require('../db/index');

module.exports = {
  getByCompany: async (company_id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM pan_cin_details WHERE company_id = ? AND is_active = 1`,
        [company_id]
      );
      return { success: true, panCINDetails: result.rows[0] || null };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  upsert: async (data) => {
    try {
      const existing = await db.execute(
        `SELECT * FROM pan_cin_details WHERE company_id = ?`,
        [data.company_id]
      );

      if (existing.rows.length > 0) {
        await db.execute(
          `UPDATE pan_cin_details SET
            pan_number = ?,
            cin_number = ?,
            is_active  = 1,
            updated_at = datetime('now')
          WHERE company_id = ?`,
          [
            data.pan_number || null,
            data.cin_number || null,
            data.company_id,
          ]
        );
      } else {
        await db.execute(
          `INSERT INTO pan_cin_details (company_id, pan_number, cin_number, is_active)
           VALUES (?, ?, ?, 1)`,
          [
            data.company_id,
            data.pan_number || null,
            data.cin_number || null,
          ]
        );
      }

      const saved = await db.execute(
        `SELECT * FROM pan_cin_details WHERE company_id = ?`,
        [data.company_id]
      );
      return { success: true, panCINDetails: saved.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
