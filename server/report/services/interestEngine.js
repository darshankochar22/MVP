// Interest calculation engine — pure functions, no DB.
//
// Interest accrues PIECEWISE: a bill's pending amount changes at every partial
// settlement, so the period is split into segments (one per constant-amount
// stretch) and each segment accrues on its own amount. A single flat
// calculation on the closing balance is wrong the moment one partial payment
// exists — that is the classic from-scratch-clone bug this engine avoids.
//
// Rate-style semantics (matches TallyPrime, where the style names the RATE
// PERIOD, not just a day-count convention):
//   '365-Day Year'   rate is % per annum, day count / 365
//   'Calendar Year'  rate is % per annum, day count / actual days in that year
//                    (leap years handled by splitting segments at 1-Jan)
//   '30-Day Month'   rate is % per month, day count / 30
//   'Calendar Month' rate is % per month, day count / days in that month
//                    (approximated as the average month, 30.4167)

const MS_DAY = 1000 * 60 * 60 * 24;

const dayDiff = (fromDate, toDate) => {
  if (!fromDate || !toDate) return 0;
  const a = new Date(fromDate);
  const b = new Date(toDate);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.floor((b.getTime() - a.getTime()) / MS_DAY);
};

const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const addDaysIso = (iso, n) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  const pad = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Interest for one constant-amount stretch [from, to] at one rate.
// 'Calendar Year' splits at 1-Jan boundaries so each portion divides by the
// actual length of ITS year (365 or 366).
const segmentInterest = (amount, fromDate, toDate, rate, style) => {
  const days = dayDiff(fromDate, toDate);
  if (days <= 0 || !rate || !amount) return 0;
  const amt = Math.abs(amount);

  if (style === '30-Day Month') return amt * (rate / 100) * (days / 30);
  if (style === 'Calendar Month') return amt * (rate / 100) * (days / 30.4167);
  if (style === 'Calendar Year') {
    let total = 0;
    let cursor = fromDate;
    while (dayDiff(cursor, toDate) > 0) {
      const year = new Date(cursor).getFullYear();
      const yearEnd = `${year}-12-31`;
      const sliceEnd = yearEnd < toDate ? yearEnd : toDate;
      const sliceDays = Math.min(dayDiff(cursor, sliceEnd) + (sliceEnd === yearEnd ? 1 : 0), dayDiff(cursor, toDate));
      total += amt * (rate / 100) * (sliceDays / (isLeapYear(year) ? 366 : 365));
      cursor = addDaysIso(cursor, sliceDays);
    }
    return total;
  }
  return amt * (rate / 100) * (days / 365); // 365-Day Year
};

// Rate applicable on a given date: the matching slab wins, else the base rate.
const rateForDate = (date, baseRate, slabs) => {
  if (Array.isArray(slabs)) {
    for (const s of slabs) {
      if (s.from_date && date >= s.from_date && (!s.to_date || date <= s.to_date)) {
        return Number(s.rate) || 0;
      }
    }
  }
  return baseRate;
};

/**
 * Piecewise segments for a bill between start_date and end_date.
 *
 * Split points: every settlement date (amount changes) and every rate-slab
 * boundary (rate changes). Each segment carries the amount pending and the
 * rate applicable throughout it. Overpayment floors the pending amount at 0
 * and stops generating segments.
 *
 * bill: { original_amount, settlements: [{date, amount}] }  (date-sorted)
 * Returns [{ amount, rate, from, to, days, interest }]
 */
const buildSegments = (bill, start_date, end_date, { rate = 0, style = '365-Day Year', slabs = null } = {}) => {
  if (!start_date || !end_date || dayDiff(start_date, end_date) <= 0) return [];

  // Amount pending when interest starts: origin minus settlements up to start.
  let current = Number(bill.original_amount) || 0;
  const later = [];
  for (const s of bill.settlements || []) {
    if (s.date <= start_date) current -= s.amount;
    else if (s.date <= end_date) later.push(s);
  }
  current = Math.max(0, current);

  // Breakpoints: settlements + slab boundaries inside (start, end).
  const points = new Map(); // date -> settled amount on that date
  for (const s of later) points.set(s.date, (points.get(s.date) || 0) + s.amount);
  const slabDates = [];
  if (Array.isArray(slabs)) {
    for (const s of slabs) {
      for (const d of [s.from_date, s.to_date ? addDaysIso(s.to_date, 1) : null]) {
        if (d && d > start_date && d < end_date) slabDates.push(d);
      }
    }
  }
  const cutDates = [...new Set([...points.keys(), ...slabDates])].sort();

  const segments = [];
  let cursor = start_date;
  const pushSegment = (from, to, amount) => {
    if (amount <= 0 || dayDiff(from, to) <= 0) return;
    const r = rateForDate(from, rate, slabs);
    const interest = segmentInterest(amount, from, to, r, style);
    segments.push({ amount, rate: r, from, to, days: dayDiff(from, to), interest });
  };

  for (const cut of cutDates) {
    pushSegment(cursor, cut, current);
    current = Math.max(0, current - (points.get(cut) || 0));
    cursor = cut;
  }
  pushSegment(cursor, end_date, current);

  return segments;
};

const applyRounding = (value, method = 'No Rounding', limit = 1) => {
  const lim = Number(limit) > 0 ? Number(limit) : 1;
  if (method === 'Round Nearest') return Math.round(value / lim) * lim;
  if (method === 'Round Upward') return Math.ceil(value / lim) * lim;
  if (method === 'Round Downward') return Math.floor(value / lim) * lim;
  return value;
};

/**
 * Full bill interest: resolves the accrual start from the ledger config,
 * builds segments, sums, rounds.
 *
 * ledgerCfg: { rate, style, applicable_from ('Due Date'|'Bill Date'),
 *              rounding_method, rounding_limit, slabs }
 * Returns { interest, segments, days, start_date, missing_due_date }
 */
const computeBillInterest = (bill, ledgerCfg, end_date) => {
  const applicableFrom = ledgerCfg.applicable_from || 'Due Date';
  let start = null;
  let missingDueDate = false;

  if (applicableFrom === 'Bill Date') {
    start = bill.bill_date;
  } else {
    start = bill.due_date;
    if (!start && bill.credit_period != null && bill.bill_date) {
      const days = Number(String(bill.credit_period).replace(/[^\d.-]/g, ''));
      if (Number.isFinite(days) && days >= 0) start = addDaysIso(bill.bill_date, days);
    }
    if (!start) {
      // No due date and no credit period: due immediately (Tally accrues from
      // the bill date) — but FLAG it so the report can surface the gap instead
      // of hiding it.
      missingDueDate = true;
      start = bill.bill_date;
    }
    if (!start) {
      // No bill date either — nothing sane to accrue from.
      return { interest: 0, segments: [], days: 0, start_date: null, missing_due_date: true };
    }
  }

  const segments = buildSegments(bill, start, end_date, {
    rate: Number(ledgerCfg.rate) || 0,
    style: ledgerCfg.style || '365-Day Year',
    slabs: ledgerCfg.slabs || null,
  });

  const raw = segments.reduce((s, seg) => s + seg.interest, 0);
  const interest = applyRounding(raw, ledgerCfg.rounding_method, ledgerCfg.rounding_limit);
  const days = Math.max(0, dayDiff(start, end_date));
  return { interest, segments, days, start_date: start, missing_due_date: missingDueDate };
};

const parseSlabs = (json) => {
  if (!json) return null;
  if (Array.isArray(json)) return json;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
};

module.exports = {
  dayDiff,
  segmentInterest,
  buildSegments,
  applyRounding,
  computeBillInterest,
  rateForDate,
  parseSlabs,
};
