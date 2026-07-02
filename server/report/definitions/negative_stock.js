const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { stockItems, voucherStockEntries, vouchers } = require('../../db/schema');
const { entryDirection } = require('../services/stockMovement');

module.exports = {
  run: async (company_id, fy_id, params = {}) => {
    try {
      const items = await db.all(
        sql`SELECT item_id, name, opening_quantity
            FROM ${stockItems}
            WHERE company_id = ${company_id} AND is_active = 1`
      );

      const entries = await db.all(
        sql`SELECT vse.stock_item_id, vse.quantity, vse.is_source, v.date, v.voucher_type, v.voucher_number
            FROM ${voucherStockEntries} vse
            INNER JOIN ${vouchers} v ON v.voucher_id = vse.voucher_id
            WHERE v.company_id = ${company_id} AND v.fy_id = ${fy_id} AND v.is_cancelled = 0
              AND COALESCE(v.is_optional, 0) = 0 AND COALESCE(v.is_post_dated, 0) = 0
            ORDER BY v.date ASC, v.voucher_id ASC, vse.stock_entry_id ASC`
      );

      const result = [];

      for (const item of items) {
        const itemId = item.item_id;
        const itemEntries = entries.filter(e => e.stock_item_id === itemId);

        let runningQty = Number(item.opening_quantity) || 0;
        const negativeInstances = [];

        for (const entry of itemEntries) {
          const qty = Number(entry.quantity) || 0;
          const dir = entryDirection(entry.voucher_type, entry.is_source);

          if (dir === 'in') {
            runningQty += qty;
          } else if (dir === 'out') {
            runningQty -= qty;
          }

          if (runningQty < 0) {
            negativeInstances.push({
              date: entry.date,
              voucher_type: entry.voucher_type,
              voucher_number: entry.voucher_number,
              quantity: qty,
              balance: runningQty
            });
          }
        }

        result.push({
          item_id: itemId,
          item_name: item.name,
          current_quantity: runningQty,
          negative_instances: negativeInstances
        });
      }

      return { success: true, items: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
