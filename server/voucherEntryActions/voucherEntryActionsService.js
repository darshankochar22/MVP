// models/voucherEntryAction.js

const { db } = require('../db/index');

const serialize = (v) => (v != null && typeof v === 'object' ? JSON.stringify(v) : v ?? null);
const nullify   = (v) => (v === undefined ? null : v ?? null);

module.exports = {
  create: async (data) => {
    try {
      const result = await db.execute({
        sql: `INSERT INTO voucher_entry_actions (
                company_id, voucher_id, action_type, action_data,
                autofill_ledger_id, autofill_amount, autofill_narration,
                previous_mode, new_mode, additional_details,
                related_report_type, related_report_id,
                is_optional, optional_reason, performed_by, performed_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          data.company_id,
          nullify(data.voucher_id),
          data.action_type,
          serialize(data.action_data),
          nullify(data.autofill_ledger_id),
          nullify(data.autofill_amount),
          nullify(data.autofill_narration),
          nullify(data.previous_mode),
          nullify(data.new_mode),
          serialize(data.additional_details),
          nullify(data.related_report_type),
          nullify(data.related_report_id),
          data.is_optional ? 1 : 0,
          nullify(data.optional_reason),
          nullify(data.performed_by),
          data.performed_at || new Date().toISOString(),
        ],
      });

      const action = await db.execute({
        sql: `SELECT * FROM voucher_entry_actions WHERE action_id = ?`,
        args: [Number(result.lastInsertRowid)],
      });

      return { success: true, action: parseAction(action.rows[0]) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const result = await db.execute({
        sql: `SELECT * FROM voucher_entry_actions
              WHERE company_id = ?
              ORDER BY performed_at DESC`,
        args: [company_id],
      });
      return { success: true, actions: result.rows.map(parseAction) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getByVoucher: async (voucher_id) => {
    try {
      const result = await db.execute({
        sql: `SELECT * FROM voucher_entry_actions
              WHERE voucher_id = ?
              ORDER BY performed_at ASC`,
        args: [voucher_id],
      });
      return { success: true, actions: result.rows.map(parseAction) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getByCompany: async (company_id, { from_date, to_date, action_type, limit = 200 } = {}) => {
    try {
      let sql  = `SELECT * FROM voucher_entry_actions WHERE company_id = ?`;
      const args = [company_id];

      if (from_date)   { sql += ` AND performed_at >= ?`; args.push(from_date); }
      if (to_date)     { sql += ` AND performed_at <= ?`; args.push(to_date);   }
      if (action_type) { sql += ` AND action_type = ?`;   args.push(action_type); }

      sql += ` ORDER BY performed_at DESC LIMIT ?`;
      args.push(limit);

      const result = await db.execute({ sql, args });
      return { success: true, actions: result.rows.map(parseAction) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const existing = await db.execute({
        sql: `SELECT action_id FROM voucher_entry_actions WHERE action_id = ?`,
        args: [id],
      });
      if (existing.rows.length === 0) return { success: false, error: 'Action not found' };

      await db.execute({
        sql: `DELETE FROM voucher_entry_actions WHERE action_id = ?`,
        args: [id],
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};

// Parse JSON fields back to objects on read
function parseAction(row) {
  if (!row) return row;
  return {
    ...row,
    action_data:        tryParse(row.action_data),
    additional_details: tryParse(row.additional_details),
  };
}

function tryParse(v) {
  if (v == null || typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
}