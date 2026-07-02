const { db } = require('../db/index');
const { sql } = require('drizzle-orm');
const { godowns, voucherStockEntries, vouchers, stockItems } = require('../db/schema');
const { inwardCondSql, outwardCondSql } = require('./services/stockMovement');
const { calculateGodownClosing } = require('./stockValuationEngine');

module.exports = {
  godownSummary: async (company_id, fy_id, as_on_date) => {
    try {
      // Weighted-average COST per godown via the shared engine — Stock Journal
      // legs land in their own godowns, opening allocations included, outward
      // consumption at cost (never inward amount − sale amount).
      const godownRows = await db.all(
        sql`SELECT g.godown_id, COALESCE(g.name, 'Main Location') AS godown_name
            FROM ${godowns} g
            WHERE g.company_id = ${company_id} AND g.is_active = 1
            ORDER BY godown_name ASC`
      );
      const closing = await calculateGodownClosing(company_id, fy_id, as_on_date);
      const byGodown = new Map((closing.godowns || []).map(g => [g.godown_id, g]));
      const rows = godownRows.map(g => {
        const c = byGodown.get(g.godown_id) || { item_count: 0, closing_value: 0 };
        return {
          godown_id: g.godown_id,
          godown_name: g.godown_name,
          item_count: c.item_count,
          value: c.closing_value,
        };
      });
      return { success: true, rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  stockAgeing: async (company_id, fy_id, as_on_date) => {
    try {
      // Simplified Ageing Analysis based on last inwards.
      // Age is measured against the report's as-on date — NOT today — so a
      // back-dated report buckets purchases the way they stood on that date.
      const asOn = as_on_date || new Date().toISOString().slice(0, 10);
      const dateCond = as_on_date ? sql` AND v.date <= ${as_on_date}` : sql``;

      const rows = await db.all(
        sql`SELECT
              si.item_id,
              si.name AS item_name,
              SUM(CASE WHEN ${inwardCondSql('v', 'vse')} THEN vse.amount ELSE 0 END) -
              SUM(CASE WHEN ${outwardCondSql('v', 'vse')} THEN vse.amount ELSE 0 END) AS value,
              SUM(CASE WHEN (julianday(${asOn}) - julianday(v.date)) <= 30 AND ${inwardCondSql('v', 'vse')} THEN vse.amount ELSE 0 END) AS days30,
              SUM(CASE WHEN (julianday(${asOn}) - julianday(v.date)) > 30 AND (julianday(${asOn}) - julianday(v.date)) <= 60 AND ${inwardCondSql('v', 'vse')} THEN vse.amount ELSE 0 END) AS days60,
              SUM(CASE WHEN (julianday(${asOn}) - julianday(v.date)) > 60 AND ${inwardCondSql('v', 'vse')} THEN vse.amount ELSE 0 END) AS daysOver
            FROM ${stockItems} si
            LEFT JOIN ${voucherStockEntries} vse ON vse.stock_item_id = si.item_id
            LEFT JOIN ${vouchers} v ON v.voucher_id = vse.voucher_id
            WHERE si.company_id = ${company_id} AND si.is_active = 1
              AND (v.company_id IS NULL OR (v.company_id = ${company_id} AND v.fy_id = ${fy_id} AND v.is_cancelled = 0
              AND COALESCE(v.is_optional, 0) = 0 AND COALESCE(v.is_post_dated, 0) = 0${dateCond}))
            GROUP BY si.item_id, si.name
            HAVING value > 0
            ORDER BY si.name ASC`
      );
      return { success: true, rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  movementAnalysis: async (company_id, fy_id, as_on_date) => {
    try {
      const dateCond = as_on_date ? sql` AND v.date <= ${as_on_date}` : sql``;
      const rows = await db.all(
        sql`SELECT
              si.name AS name,
              SUM(CASE WHEN ${inwardCondSql('v', 'vse')} THEN vse.quantity ELSE 0 END) AS in_qty,
              SUM(CASE WHEN ${outwardCondSql('v', 'vse')} THEN vse.quantity ELSE 0 END) AS out_qty
            FROM ${stockItems} si
            LEFT JOIN ${voucherStockEntries} vse ON vse.stock_item_id = si.item_id
            LEFT JOIN ${vouchers} v ON v.voucher_id = vse.voucher_id
            WHERE si.company_id = ${company_id} AND si.is_active = 1
              AND (v.company_id IS NULL OR (v.company_id = ${company_id} AND v.fy_id = ${fy_id} AND v.is_cancelled = 0
              AND COALESCE(v.is_optional, 0) = 0 AND COALESCE(v.is_post_dated, 0) = 0${dateCond}))
            GROUP BY si.item_id, si.name
            ORDER BY si.name ASC`
      );
      return { success: true, rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  reorderStatus: async (company_id, fy_id) => {
    try {
      const rows = await db.all(
        sql`SELECT
              si.name AS item_name,
              COALESCE(si.opening_quantity, 0) +
              COALESCE((SELECT SUM(vse.quantity) FROM ${voucherStockEntries} vse JOIN ${vouchers} v ON v.voucher_id = vse.voucher_id WHERE vse.stock_item_id = si.item_id AND v.company_id = ${company_id} AND v.fy_id = ${fy_id} AND v.is_cancelled = 0 AND COALESCE(v.is_optional, 0) = 0 AND COALESCE(v.is_post_dated, 0) = 0 AND ${inwardCondSql('v', 'vse')}), 0) -
              COALESCE((SELECT SUM(vse.quantity) FROM ${voucherStockEntries} vse JOIN ${vouchers} v ON v.voucher_id = vse.voucher_id WHERE vse.stock_item_id = si.item_id AND v.company_id = ${company_id} AND v.fy_id = ${fy_id} AND v.is_cancelled = 0 AND COALESCE(v.is_optional, 0) = 0 AND COALESCE(v.is_post_dated, 0) = 0 AND ${outwardCondSql('v', 'vse')}), 0) AS closing,
              COALESCE(si.reorder_level, 0) AS level,
              0 AS shortage
            FROM ${stockItems} si
            WHERE si.company_id = ${company_id} AND si.is_active = 1`
      );
      const processed = rows.map(r => {
        const shortage = r.closing < r.level ? r.level - r.closing : 0;
        return {
          ...r,
          closing: r.closing + " Pcs",
          level: r.level + " Pcs",
          shortage: shortage + " Pcs"
        };
      });
      return { success: true, rows: processed };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  orderOutstanding: async (company_id, fy_id, type) => {
    try {
      const targetType = type === 'sales' ? 'Sales Order' : 'Purchase Order';
      const rows = await db.all(
        sql`SELECT
              v.date,
              v.voucher_number AS ref_no,
              v.party_name,
              SUM(vse.amount) AS value
            FROM ${vouchers} v
            LEFT JOIN ${voucherStockEntries} vse ON vse.voucher_id = v.voucher_id
            WHERE v.company_id = ${company_id} AND v.fy_id = ${fy_id}
              AND v.voucher_type = ${targetType} AND v.is_cancelled = 0
            GROUP BY v.voucher_id
            ORDER BY v.date DESC`
      );
      return { success: true, rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
