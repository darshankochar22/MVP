const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { stockItems, stockGroups } = require('../../db/schema');
const { calculateClosingStock } = require('../stockValuationEngine');

/**
 * Stock Group Summary — closing inventory qty/value per stock group.
 *
 * Values come from the shared valuation engine (opening balances included,
 * cancelled/optional/post-dated vouchers excluded, outward consumption at
 * cost). Each group row is its SUBTREE total: a parent group includes every
 * descendant group's items, TallyPrime-style.
 */
const stockGroupSummary = async (company_id, fy_id) => {
  try {
    const groups = await db.all(sql`
      SELECT sg_id, name, parent_group_id
      FROM ${stockGroups}
      WHERE company_id = ${company_id} AND is_active = 1`);

    const items = await db.all(sql`
      SELECT item_id, group_id
      FROM ${stockItems}
      WHERE company_id = ${company_id} AND is_active = 1`);

    const valuation = await calculateClosingStock(company_id, fy_id, null, 'FIFO');
    const valMap = new Map((valuation.items || []).map(v => [v.item_id, v]));

    // Add each item's closing to its group and every ancestor group, so a
    // parent reports its whole subtree.
    const totals = new Map(); // sg_id -> { qty, value }
    const bump = (sg_id, qty, value) => {
      if (!totals.has(sg_id)) totals.set(sg_id, { qty: 0, value: 0 });
      const t = totals.get(sg_id);
      t.qty += qty;
      t.value += value;
    };

    const parentOf = new Map(groups.map(g => [g.sg_id, g.parent_group_id]));
    for (const it of items) {
      if (it.group_id == null) continue;
      const v = valMap.get(it.item_id);
      if (!v) continue;
      let cur = it.group_id;
      const seen = new Set();
      while (cur != null && parentOf.has(cur) && !seen.has(cur)) {
        seen.add(cur);
        bump(cur, v.closing_qty || 0, v.closing_value || 0);
        cur = parentOf.get(cur);
      }
    }

    const rows = groups
      .map(g => {
        const t = totals.get(g.sg_id) || { qty: 0, value: 0 };
        return { group_id: g.sg_id, group_name: g.name, qty: t.qty, value: t.value };
      })
      .sort((a, b) => a.group_name.localeCompare(b.group_name));

    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { stockGroupSummary };
