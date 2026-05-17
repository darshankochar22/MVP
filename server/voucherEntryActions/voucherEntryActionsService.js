const { db } = require('../db/index');

module.exports = {
  create: async (data) => {
    try {
      const result = await db.execute(
        `INSERT INTO voucher_entry_actions (
          company_id, voucher_id, action_type, action_data,
          autofill_ledger_id, autofill_amount, autofill_narration,
          previous_mode, new_mode, additional_details,
          related_report_type, related_report_id,
          is_optional, optional_reason, performed_by, performed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.company_id,
          data.voucher_id || null,
          data.action_type,
          data.action_data || null,
          data.autofill_ledger_id || null,
          data.autofill_amount || null,
          data.autofill_narration || null,
          data.previous_mode || null,
          data.new_mode || null,
          data.additional_details || null,
          data.related_report_type || null,
          data.related_report_id || null,
          data.is_optional ? 1 : 0,
          data.optional_reason || null,
          data.performed_by || null,
          data.performed_at || new Date().toISOString(),
        ]
      );

      const action = await db.execute(
        `SELECT * FROM voucher_entry_actions WHERE action_id = ?`,
        [result.lastInsertRowid]
      );
      return { success: true, action: action.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM voucher_entry_actions WHERE company_id = ? ORDER BY performed_at DESC`,
        [company_id]
      );
      return { success: true, actions: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getByVoucher: async (voucher_id) => {
    try {
      const result = await db.execute(
        `SELECT * FROM voucher_entry_actions WHERE voucher_id = ? ORDER BY performed_at DESC`,
        [voucher_id]
      );
      return { success: true, actions: result.rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const existing = await db.execute(
        `SELECT * FROM voucher_entry_actions WHERE action_id = ?`, [id]
      );
      if (existing.rows.length === 0) return { success: false, error: 'Action not found' };

      await db.execute(
        `DELETE FROM voucher_entry_actions WHERE action_id = ?`, [id]
      );
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};