const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { stockItems, stockCategories } = require('../../db/schema');
const { calculateClosingStock } = require('../stockValuationEngine');

/**
 * Stock Category Summary — closing inventory qty/value per stock category.
 *
 * Values come from the shared valuation engine (opening balances included,
 * cancelled/optional/post-dated vouchers excluded, outward consumption at
 * cost). The old query summed voucher amounts only — no opening stock, no
 * optional/post-dated filters, sales at sale price.
 */
const stockCategorySummary = async (company_id, fy_id) => {
  try {
    const items = await db.all(sql`
      SELECT si.item_id, sc.name AS category_name
      FROM ${stockItems} si
      LEFT JOIN ${stockCategories} sc ON sc.sc_id = si.category_id
      WHERE si.company_id = ${company_id} AND si.is_active = 1`);

    const valuation = await calculateClosingStock(company_id, fy_id, null, 'FIFO');
    const valMap = new Map((valuation.items || []).map(v => [v.item_id, v]));

    const totals = new Map(); // category name -> { qty, value }
    for (const it of items) {
      const v = valMap.get(it.item_id);
      if (!v) continue;
      const name = it.category_name || 'No Category';
      if (!totals.has(name)) totals.set(name, { qty: 0, value: 0 });
      const t = totals.get(name);
      t.qty += v.closing_qty || 0;
      t.value += v.closing_value || 0;
    }

    const rows = [...totals.entries()]
      .map(([category_name, t]) => ({ category_name, qty: t.qty, value: t.value }))
      .sort((a, b) => a.category_name.localeCompare(b.category_name));

    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { stockCategorySummary };
