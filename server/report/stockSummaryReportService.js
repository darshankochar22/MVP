const { db } = require('../db/index');
const { sql } = require('drizzle-orm');
const { stockItems, stockGroups, voucherStockEntries, vouchers, units } = require('../db/schema');
const { calculateClosingStock } = require('./stockValuationEngine');


const INWARD_TYPES = ['Purchase', 'Receipt Note', 'Rejection In', 'Material In'];
const OUTWARD_TYPES = ['Sales', 'Delivery Note', 'Rejection Out', 'Material Out'];

module.exports = {

  stockGroupItems: async (company_id, fy_id, group_id) => {
    try {
      const { stockItems, stockGroups, voucherStockEntries, vouchers, units } = require('../db/schema');
      const INWARD_TYPES  = ['Purchase', 'Receipt Note', 'Rejection In', 'Material In'];
      const OUTWARD_TYPES = ['Sales', 'Delivery Note', 'Rejection Out', 'Material Out'];

      const rows = await db.all(
        sql`SELECT
              si.item_id        AS item_id,
              si.name           AS item_name,
              sg.name           AS group_name,
              u.name            AS unit_name,
              COALESCE(si.opening_quantity, 0) AS opening_qty,
              COALESCE(si.opening_value, 0)    AS opening_value,
              COALESCE(mv.inwards_qty, 0)      AS inwards_qty,
              COALESCE(mv.inwards_value, 0)    AS inwards_value,
              COALESCE(mv.outwards_qty, 0)     AS outwards_qty,
              COALESCE(mv.outwards_value, 0)   AS outwards_value
            FROM ${stockItems} si
            LEFT JOIN ${stockGroups} sg ON sg.sg_id = si.group_id
            LEFT JOIN ${units} u ON u.unit_id = si.unit_id
            LEFT JOIN (
              SELECT
                vse.stock_item_id AS stock_item_id,
                SUM(CASE WHEN v.voucher_type IN (${sql.join(INWARD_TYPES.map(t => sql`${t}`), sql`, `)})
                         THEN vse.quantity ELSE 0 END) AS inwards_qty,
                SUM(CASE WHEN v.voucher_type IN (${sql.join(INWARD_TYPES.map(t => sql`${t}`), sql`, `)})
                         THEN vse.amount ELSE 0 END) AS inwards_value,
                SUM(CASE WHEN v.voucher_type IN (${sql.join(OUTWARD_TYPES.map(t => sql`${t}`), sql`, `)})
                         THEN vse.quantity ELSE 0 END) AS outwards_qty,
                SUM(CASE WHEN v.voucher_type IN (${sql.join(OUTWARD_TYPES.map(t => sql`${t}`), sql`, `)})
                         THEN vse.amount ELSE 0 END) AS outwards_value
              FROM ${voucherStockEntries} vse
              INNER JOIN ${vouchers} v ON v.voucher_id = vse.voucher_id
              WHERE v.company_id = ${company_id}
                AND v.fy_id = ${fy_id}
                AND v.is_cancelled = 0
                AND COALESCE(v.is_optional, 0) = 0
                AND COALESCE(v.is_post_dated, 0) = 0
              GROUP BY vse.stock_item_id
            ) mv ON mv.stock_item_id = si.item_id
            WHERE si.company_id = ${company_id}
              AND si.is_active = 1
              AND si.group_id = ${group_id}
            ORDER BY si.name ASC`
      );

      const items = rows.map(r => {
        const opening_qty   = r.opening_qty   || 0;
        const opening_value = r.opening_value || 0;
        const inwards_qty   = r.inwards_qty   || 0;
        const inwards_value = r.inwards_value || 0;
        const outwards_qty  = r.outwards_qty  || 0;
        const outwards_value= r.outwards_value|| 0;
        const closing_qty   = opening_qty + inwards_qty - outwards_qty;
        const closing_value = opening_value + inwards_value - outwards_value;
        const rate = closing_qty !== 0 ? closing_value / closing_qty : 0;
        return {
          item_id: r.item_id,
          item_name: r.item_name,
          group_name: r.group_name || 'Ungrouped',
          unit_name: r.unit_name || '',
          closing_qty,
          closing_value,
          rate,
        };
      });

      const totalClosingQty   = items.reduce((s, it) => s + it.closing_qty,   0);
      const totalClosingValue = items.reduce((s, it) => s + it.closing_value, 0);

      return { success: true, items, totalClosingQty, totalClosingValue };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },


  stockItemMonthly: async (company_id, fy_id, item_id) => {
    try {
      const { stockItems, voucherStockEntries, vouchers } = require('../db/schema');
      const INWARD_TYPES  = ['Purchase', 'Receipt Note', 'Rejection In', 'Material In'];
      const OUTWARD_TYPES = ['Sales', 'Delivery Note', 'Rejection Out', 'Material Out'];

      // Fetch financial year boundaries
      const fyRows = await db.all(sql`SELECT * FROM financial_years WHERE fy_id = ${fy_id}`);
      if (fyRows.length === 0) return { success: false, error: 'Financial year not found' };
      const fy = fyRows[0];
      const startYear = new Date(fy.start_date).getFullYear();

      // Fetch item meta (opening balance)
      const itemRows = await db.all(
        sql`SELECT item_id, name, opening_quantity, opening_value FROM ${stockItems}
            WHERE item_id = ${item_id} AND company_id = ${company_id}`
      );
      if (itemRows.length === 0) return { success: false, error: 'Stock item not found' };
      const item = itemRows[0];

      // Fetch all stock entries for this item in this FY
      const entries = await db.all(
        sql`SELECT v.date, v.voucher_type, vse.quantity, vse.amount
            FROM ${voucherStockEntries} vse
            INNER JOIN ${vouchers} v ON v.voucher_id = vse.voucher_id
            WHERE v.company_id = ${company_id}
              AND v.fy_id = ${fy_id}
              AND v.is_cancelled = 0
              AND COALESCE(v.is_optional, 0) = 0
              AND COALESCE(v.is_post_dated, 0) = 0
              AND vse.stock_item_id = ${item_id}`
      );

      // Build 12 months Apr → Mar
      const MONTH_NAMES = ['April','May','June','July','August','September','October','November','December','January','February','March'];
      let runningQty   = item.opening_quantity || 0;
      let runningValue = item.opening_value    || 0;

      const months = MONTH_NAMES.map((name, idx) => {
        let m = idx + 4;
        let y = startYear;
        if (m > 12) { m -= 12; y = startYear + 1; }
        const prefix = `${y}-${String(m).padStart(2, '0')}`;

        const monthEntries = entries.filter(e => e.date && e.date.startsWith(prefix));
        const inward  = monthEntries.filter(e => INWARD_TYPES.includes(e.voucher_type));
        const outward = monthEntries.filter(e => OUTWARD_TYPES.includes(e.voucher_type));

        const in_qty    = inward.reduce((s, e)  => s + (e.quantity || 0), 0);
        const in_value  = inward.reduce((s, e)  => s + (e.amount   || 0), 0);
        const out_qty   = outward.reduce((s, e) => s + (e.quantity || 0), 0);
        const out_value = outward.reduce((s, e) => s + (e.amount   || 0), 0);

        runningQty   += in_qty   - out_qty;
        runningValue += in_value - out_value;

        return {
          month: name,
          in_qty, in_value,
          out_qty, out_value,
          closing_qty: runningQty,
          closing_value: runningValue,
        };
      });

      return {
        success: true,
        item_name: item.name,
        opening_qty: item.opening_quantity || 0,
        opening_value: item.opening_value  || 0,
        months,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  stockSummary: async (company_id, fy_id, as_on_date, method = 'FIFO') => {
    try {
      const dateCond = as_on_date ? sql` AND v.date <= ${as_on_date}` : sql``;

      const allGroups = await db.all(
        sql`SELECT sg_id AS group_id, name AS group_name, parent_group_id
            FROM ${stockGroups}
            WHERE company_id = ${company_id} AND is_active = 1`
      );

      const rows = await db.all(
        sql`SELECT
              si.item_id        AS item_id,
              si.name           AS item_name,
              si.group_id       AS group_id,
              sg.name           AS group_name,
              u.name            AS unit_name,
              COALESCE(si.opening_quantity, 0) AS opening_qty,
              COALESCE(si.opening_value, 0)    AS opening_value,
              COALESCE(mv.inwards_qty, 0)      AS inwards_qty,
              COALESCE(mv.inwards_value, 0)    AS inwards_value,
              COALESCE(mv.outwards_qty, 0)     AS outwards_qty,
              COALESCE(mv.outwards_value, 0)   AS outwards_value
            FROM ${stockItems} si
            LEFT JOIN ${stockGroups} sg ON sg.sg_id = si.group_id
            LEFT JOIN ${units} u ON u.unit_id = si.unit_id
            LEFT JOIN (
              SELECT
                vse.stock_item_id AS stock_item_id,
                SUM(CASE WHEN v.voucher_type IN (${sql.join(INWARD_TYPES.map(t => sql`${t}`), sql`, `)})
                         THEN vse.quantity ELSE 0 END) AS inwards_qty,
                SUM(CASE WHEN v.voucher_type IN (${sql.join(INWARD_TYPES.map(t => sql`${t}`), sql`, `)})
                         THEN vse.amount ELSE 0 END) AS inwards_value,
                SUM(CASE WHEN v.voucher_type IN (${sql.join(OUTWARD_TYPES.map(t => sql`${t}`), sql`, `)})
                         THEN vse.quantity ELSE 0 END) AS outwards_qty,
                SUM(CASE WHEN v.voucher_type IN (${sql.join(OUTWARD_TYPES.map(t => sql`${t}`), sql`, `)})
                         THEN vse.amount ELSE 0 END) AS outwards_value
              FROM ${voucherStockEntries} vse
              INNER JOIN ${vouchers} v ON v.voucher_id = vse.voucher_id
              WHERE v.company_id = ${company_id}
                AND v.fy_id = ${fy_id}
                AND v.is_cancelled = 0
                AND COALESCE(v.is_optional, 0) = 0
                AND COALESCE(v.is_post_dated, 0) = 0${dateCond}
              GROUP BY vse.stock_item_id
            ) mv ON mv.stock_item_id = si.item_id
            WHERE si.company_id = ${company_id}
              AND si.is_active = 1
            ORDER BY sg.name ASC, si.name ASC`
      );

      const items = rows.map(r => {
        const opening_qty = r.opening_qty || 0;
        const opening_value = r.opening_value || 0;
        const inwards_qty = r.inwards_qty || 0;
        const inwards_value = r.inwards_value || 0;
        const outwards_qty = r.outwards_qty || 0;
        const outwards_value = r.outwards_value || 0;
        return {
          item_id: r.item_id,
          item_name: r.item_name,
          group_id: r.group_id,
          group_name: r.group_name || 'Ungrouped',
          unit_name: r.unit_name || '',
          opening_qty,
          opening_value,
          inwards_qty,
          inwards_value,
          outwards_qty,
          outwards_value,
          closing_qty: opening_qty + inwards_qty - outwards_qty,
          closing_value: 0, // Will be overridden by valuation engine
          rate: 0,           // derived after valuation below
        };
      });

      // Run valuation engine for true closing stock valuation
      const valuationData = await calculateClosingStock(company_id, fy_id, as_on_date, method);
      if (valuationData.success) {
        const valMap = new Map();
        for (const v of valuationData.items) {
          valMap.set(v.item_id, v.closing_value);
        }
        for (const it of items) {
          if (valMap.has(it.item_id)) {
            it.closing_value = valMap.get(it.item_id);
          }
        }
      } else {
        // Fallback to simple arithmetic if valuation fails
        for (const it of items) {
          it.closing_value = it.opening_value + it.inwards_value - it.outwards_value;
        }
      }

      for (const it of items) {
        it.rate = it.closing_qty !== 0 ? it.closing_value / it.closing_qty : 0;
      }


      const childrenOf = new Map(); // group_id -> [child group_id, ...]
      for (const g of allGroups) {
        if (g.parent_group_id == null) continue;
        if (!childrenOf.has(g.parent_group_id)) childrenOf.set(g.parent_group_id, []);
        childrenOf.get(g.parent_group_id).push(g.group_id);
      }

      const directItemsByGroup = new Map(); // group_id|'ungrouped' -> ItemRow[]
      for (const it of items) {
        const key = it.group_id == null ? 'ungrouped' : it.group_id;
        if (!directItemsByGroup.has(key)) directItemsByGroup.set(key, []);
        directItemsByGroup.get(key).push(it);
      }

      const buildNode = (group) => {
        const directItems = directItemsByGroup.get(group.group_id) || [];
        const childGroupIds = childrenOf.get(group.group_id) || [];
        const childNodes = childGroupIds
          .map(id => allGroups.find(g => g.group_id === id))
          .filter(Boolean)
          .map(buildNode);

        let closing_qty = directItems.reduce((s, it) => s + it.closing_qty, 0);
        let closing_value = directItems.reduce((s, it) => s + it.closing_value, 0);
        let item_count = directItems.length;
        const unitSet = new Set(directItems.map(it => it.unit_name || ''));
        for (const child of childNodes) {
          closing_qty += child.closing_qty;
          closing_value += child.closing_value;
          item_count += child.item_count;
          for (const u of child.unit_set) unitSet.add(u);
        }

        const qtyDisplayable = unitSet.size === 1;

        return {
          group_id: group.group_id,
          group_name: group.group_name,
          closing_qty: qtyDisplayable ? closing_qty : 0,
          closing_value,
          item_count,
          qty_displayable: qtyDisplayable,
          unit_name: qtyDisplayable ? [...unitSet][0] : '',
          items: directItems,
          childGroups: childNodes,
          unit_set: unitSet, // internal only, stripped before returning to the client
        };
      };

      const topLevelGroups = allGroups.filter(g => g.parent_group_id == null);
      const rootGroupNodes = topLevelGroups.map(buildNode);
      const rootItems = directItemsByGroup.get('ungrouped') || [];

      const stripInternal = (node) => {
        const { unit_set, ...rest } = node;
        return { ...rest, childGroups: rest.childGroups.map(stripInternal) };
      };

      const groups = rootGroupNodes
        .map(stripInternal)
        .sort((a, b) => (a.group_name || '').localeCompare(b.group_name || ''));

      const topLevelUnitSet = new Set([
        ...rootItems.map(it => it.unit_name || '').filter(u => u !== ''),
        ...groups.filter(g => g.qty_displayable).map(g => g.unit_name || '').filter(u => u !== ''),
      ]);
      const totalQtyDisplayable = topLevelUnitSet.size <= 1;
      const totalClosingQty = totalQtyDisplayable
        ? rootItems.reduce((s, it) => s + it.closing_qty, 0) + groups.reduce((s, g) => s + g.closing_qty, 0)
        : 0;
      const totalClosingValue = items.reduce((s, it) => s + it.closing_value, 0);

      return {
        success: true,
        as_on_date: as_on_date || null,
        items,
        rootItems,
        groups,
        totalClosingQty,
        totalQtyDisplayable,
        totalClosingValue,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};