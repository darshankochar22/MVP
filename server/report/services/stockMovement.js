/**
 * stockMovement.js — the ONE place that decides which way stock moves.
 *
 * Every inventory report (Stock Summary, Stock Item Vouchers/Monthly, Godown,
 * Group/Category summaries, Stock Query, Negative Stock, valuation engine)
 * must classify voucher_stock_entries rows through these helpers. Per-report
 * copies of the type lists drift apart (Credit/Debit Note, Stock Journal) and
 * produce reports that disagree with each other.
 *
 * Direction rules:
 *   - STOCK_INWARD_TYPES  → goods physically enter stock
 *       (Credit Note = sales return → inward)
 *   - STOCK_OUTWARD_TYPES → goods physically leave stock
 *       (Debit Note = purchase return → outward)
 *   - DUAL_TYPES (Stock Journal / Manufacturing Journal) → per-ENTRY direction
 *       via voucher_stock_entries.is_source: 1 = source/consumption (outward),
 *       0/NULL = destination/production (inward)
 *   - Anything else (Physical Stock, orders, memos…) is NOT a stock movement
 *       for these reports → direction null.
 *
 * NOTE: these lists are intentionally separate from reportHelpers'
 * INWARD_TYPES/OUTWARD_TYPES — those mean "purchase-side vs sales-side
 * documents" for GST/statutory reports, where a Credit Note belongs with
 * SALES. Here it's physical goods flow, where a Credit Note is INWARD.
 */
const { sql } = require('drizzle-orm');

const STOCK_INWARD_TYPES = ['Purchase', 'Receipt Note', 'Rejection In', 'Material In', 'Credit Note'];
const STOCK_OUTWARD_TYPES = ['Sales', 'Delivery Note', 'Rejection Out', 'Material Out', 'Debit Note'];
const DUAL_TYPES = ['Stock Journal', 'Manufacturing Journal'];

/** 'in' | 'out' | null for one voucher_stock_entries row. */
const entryDirection = (voucher_type, is_source) => {
  if (STOCK_INWARD_TYPES.includes(voucher_type)) return 'in';
  if (STOCK_OUTWARD_TYPES.includes(voucher_type)) return 'out';
  if (DUAL_TYPES.includes(voucher_type)) {
    return (Number(is_source) || 0) === 1 ? 'out' : 'in';
  }
  return null;
};

// The type lists are module-local string constants, so inlining them with
// sql.raw is safe (no user input touches these fragments).
const quoteList = (arr) => arr.map((t) => `'${t.replace(/'/g, "''")}'`).join(', ');

/**
 * SQL boolean fragment: is this stock-entry row an inward movement?
 * @param v   alias of the vouchers table in the calling query
 * @param vse alias of the voucher_stock_entries table
 */
const inwardCondSql = (v = 'v', vse = 'vse') => sql.raw(
  `(${v}.voucher_type IN (${quoteList(STOCK_INWARD_TYPES)}) ` +
  `OR (${v}.voucher_type IN (${quoteList(DUAL_TYPES)}) AND COALESCE(${vse}.is_source, 0) = 0))`
);

/** SQL boolean fragment: is this stock-entry row an outward movement? */
const outwardCondSql = (v = 'v', vse = 'vse') => sql.raw(
  `(${v}.voucher_type IN (${quoteList(STOCK_OUTWARD_TYPES)}) ` +
  `OR (${v}.voucher_type IN (${quoteList(DUAL_TYPES)}) AND COALESCE(${vse}.is_source, 0) = 1))`
);

/**
 * Weighted-average running valuation state. Inward adds book cost; outward
 * consumes at the current average COST (never at the voucher's sales value),
 * so the running closing value stays a true inventory cost.
 *
 * Matches stockValuationEngine's Weighted Average semantics, including
 * flooring at zero when stock goes negative.
 */
const newWAState = (opening_qty = 0, opening_value = 0) => ({
  qty: Number(opening_qty) || 0,
  value: Number(opening_value) || 0,
});

/** Apply one movement; returns the COST consumed for outward entries. */
const applyWA = (state, dir, qty, amount) => {
  const q = Number(qty) || 0;
  if (dir === 'in') {
    state.qty += q;
    state.value += Number(amount) || 0;
    return 0;
  }
  if (dir === 'out') {
    const avgRate = state.qty > 0 ? state.value / state.qty : 0;
    const cost = q * avgRate;
    state.qty -= q;
    state.value -= cost;
    if (state.qty <= 0) {
      // Negative/zero stock carries no value (same rule as the engine).
      state.value = 0;
    }
    return cost;
  }
  return 0;
};

module.exports = {
  STOCK_INWARD_TYPES,
  STOCK_OUTWARD_TYPES,
  DUAL_TYPES,
  entryDirection,
  inwardCondSql,
  outwardCondSql,
  newWAState,
  applyWA,
};
