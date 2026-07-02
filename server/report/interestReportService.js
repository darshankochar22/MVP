// Interest Calculations reports.
//
// Bill-by-bill interest goes through the SHARED settlement history
// (services/billSettlementService) and the piecewise engine
// (services/interestEngine): a bill's interest is the SUM over
// constant-amount segments between partial settlements — never one flat
// calculation on the closing balance. Ledgers configured "On Outstanding
// Balance" instead accrue daily on the running ledger balance.

const { db } = require('../db/index');
const { sql } = require('drizzle-orm');
const { ledgers, groups, vouchers, voucherEntries, financialYears } = require('../db/schema');
const { getBillsWithSettlements, pendingAmount } = require('./services/billSettlementService');
const { computeBillInterest, applyRounding, dayDiff, parseSlabs } = require('./services/interestEngine');

const getDatesRange = (startStr, endStr) => {
  const dates = [];
  let curr = new Date(startStr);
  const end = new Date(endStr);
  curr.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);

  while (curr <= end) {
    dates.push(curr.toISOString().slice(0, 10));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

const INTEREST_LEDGER_COLS = sql`
  l.ledger_id, l.name, l.interest_rate, l.interest_style, l.interest_balances,
  l.activate_interest, l.is_bill_wise, l.interest_calculate_on,
  l.interest_applicable_from, l.interest_rounding_method,
  l.interest_rounding_limit, l.interest_rate_slabs`;

const getLedgerIdsInGroupRecursive = async (company_id, group_name) => {
  const rows = await db.all(sql`
    WITH RECURSIVE sub_groups AS (
      SELECT group_id FROM ${groups} WHERE name = ${group_name} AND company_id = ${company_id}
      UNION ALL
      SELECT g.group_id FROM ${groups} g
      INNER JOIN sub_groups sg ON g.parent_group_id = sg.group_id
      WHERE g.company_id = ${company_id}
    )
    SELECT ${INTEREST_LEDGER_COLS}
    FROM ${ledgers} l
    WHERE l.group_id IN (SELECT group_id FROM sub_groups) AND l.company_id = ${company_id}
  `);
  return rows;
};

const isCreditorLedger = async (company_id, ledger_id) => {
  const rows = await db.all(sql`
    WITH RECURSIVE sub_groups AS (
      SELECT group_id FROM ${groups} WHERE name = 'Sundry Creditors' AND company_id = ${company_id}
      UNION ALL
      SELECT g.group_id FROM ${groups} g
      INNER JOIN sub_groups sg ON g.parent_group_id = sg.group_id
      WHERE g.company_id = ${company_id}
    )
    SELECT l.ledger_id
    FROM ${ledgers} l
    WHERE l.ledger_id = ${ledger_id} AND l.group_id IN (SELECT group_id FROM sub_groups)
  `);
  return rows.length > 0;
};

const ledgerInterestConfig = (l) => ({
  rate: Number(l.interest_rate) || 0,
  style: l.interest_style || '365-Day Year',
  applicable_from: l.interest_applicable_from || 'Due Date',
  rounding_method: l.interest_rounding_method || 'No Rounding',
  rounding_limit: l.interest_rounding_limit ?? 1,
  slabs: parseSlabs(l.interest_rate_slabs),
});

const matchesBalanceStyle = (balStyle, isDebit) =>
  balStyle === 'All Balances' ||
  (balStyle === 'Debit Balances Only' && isDebit) ||
  (balStyle === 'Credit Balances Only' && !isDebit);

// One report row for one bill, computed piecewise via the engine.
const billRow = (bill, ledger, toDate, isCreditorSide) => {
  const cfg = ledgerInterestConfig(ledger);
  const pending = pendingAmount(bill, toDate);
  const netBalance = (Number(bill.original_amount) || 0) -
    bill.settlements.reduce((s, x) => (x.date <= toDate ? s + x.amount : s), 0);

  const isDebit = isCreditorSide ? netBalance < 0 : netBalance > 0;
  const matchBal = matchesBalanceStyle(ledger.interest_balances || 'All Balances', isDebit);

  let result = { interest: 0, segments: [], days: 0, start_date: null, missing_due_date: false };
  if (cfg.rate > 0 && matchBal) {
    result = computeBillInterest(bill, cfg, toDate);
  }

  return {
    ledger_id: bill.ledger_id,
    party_ledger: ledger.name || bill.party_name,
    bill_ref: bill.bill_name,
    bill_date: bill.bill_date,
    bill_due_date: result.start_date || bill.due_date || bill.bill_date,
    opening_amount: Number(bill.original_amount) || 0,
    total_pending: pending,
    interest_rate: cfg.rate,
    interest_style: cfg.style,
    days: result.days,
    interest_amount: result.interest,
    segments: result.segments,
    missing_due_date: result.missing_due_date,
    "0_30": result.days <= 30 ? pending : 0,
    "31_60": (result.days > 30 && result.days <= 60) ? pending : 0,
    "60": result.days > 60 ? pending : 0,
  };
};

// Running-balance accrual (ledgers set to "On Outstanding Balance", and the
// dedicated Ledger view). Daily balance × daily rate, compressed into
// constant-balance intervals for display.
const computeRunningBalanceInterest = async (company_id, fy_id, ledger, fromDate, toDate) => {
  const ledgerId = ledger.ledger_id;
  const rawOpening = Number(ledger.opening_balance) || 0;
  const effectiveOpening = rawOpening < 0
    ? rawOpening
    : (ledger.opening_balance_type === 'Cr' ? -rawOpening : rawOpening);

  const priorEntries = await db.all(sql`
    SELECT e.type, e.amount
    FROM ${voucherEntries} e
    INNER JOIN ${vouchers} v ON v.voucher_id = e.voucher_id
    WHERE e.ledger_id = ${ledgerId}
      AND v.company_id = ${company_id}
      AND v.fy_id = ${fy_id}
      AND v.is_cancelled = 0
      AND COALESCE(v.is_optional, 0) = 0
      AND COALESCE(v.is_post_dated, 0) = 0
      AND v.date < ${fromDate}
  `);
  let priorSum = 0;
  for (const entry of priorEntries) {
    priorSum += entry.type === 'Dr' ? entry.amount : -entry.amount;
  }
  const openingBalance = effectiveOpening + priorSum;

  const entries = await db.all(sql`
    SELECT e.amount, e.type, v.date, v.voucher_type, v.voucher_number, v.narration
    FROM ${voucherEntries} e
    INNER JOIN ${vouchers} v ON v.voucher_id = e.voucher_id
    WHERE e.ledger_id = ${ledgerId}
      AND v.company_id = ${company_id}
      AND v.fy_id = ${fy_id}
      AND v.is_cancelled = 0
      AND COALESCE(v.is_optional, 0) = 0
      AND COALESCE(v.is_post_dated, 0) = 0
      AND v.date >= ${fromDate}
      AND v.date <= ${toDate}
    ORDER BY v.date ASC, e.entry_id ASC
  `);

  const cfg = ledgerInterestConfig(ledger);
  const daysList = getDatesRange(fromDate, toDate);
  let runningBal = openingBalance;

  const entriesByDate = {};
  for (const entry of entries) {
    (entriesByDate[entry.date] ||= []).push(entry);
  }

  const { rateForDate } = require('./services/interestEngine');
  const dailyData = [];
  for (const day of daysList) {
    const dayEntries = entriesByDate[day] || [];
    let dayTxSum = 0;
    for (const entry of dayEntries) {
      dayTxSum += entry.type === 'Dr' ? entry.amount : -entry.amount;
    }
    runningBal += dayTxSum;

    const rate = rateForDate(day, cfg.rate, cfg.slabs);
    const balStyle = ledger.interest_balances || 'All Balances';
    const isDebit = runningBal > 0;
    const matchBal = matchesBalanceStyle(balStyle, isDebit);

    let interest = 0;
    if (rate > 0 && matchBal && Math.abs(runningBal) > 0.01) {
      const amt = Math.abs(runningBal);
      let denominator = 365;
      if (cfg.style === '30-Day Month') denominator = 30;
      else if (cfg.style === 'Calendar Month') denominator = 30.4167;
      else if (cfg.style === 'Calendar Year') {
        const y = new Date(day).getFullYear();
        denominator = ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365;
      }
      interest = amt * (rate / 100) * (1 / denominator);
    }

    dailyData.push({ date: day, balance: runningBal, interest, rate, style: cfg.style, entries: dayEntries });
  }

  const intervals = [];
  if (dailyData.length > 0) {
    let startDay = dailyData[0];
    let prevDay = dailyData[0];
    let intervalInterest = startDay.interest;

    for (let i = 1; i < dailyData.length; i++) {
      const day = dailyData[i];
      const sameBal = Math.abs(day.balance - startDay.balance) < 0.01;
      const sameRate = day.rate === startDay.rate;
      const noNewEntries = day.entries.length === 0;

      if (sameBal && sameRate && noNewEntries) {
        prevDay = day;
        intervalInterest += day.interest;
      } else {
        intervals.push({
          startDate: startDay.date, endDate: prevDay.date,
          balance: startDay.balance, rate: startDay.rate, style: startDay.style,
          days: dayDiff(startDay.date, prevDay.date) + 1,
          interest: intervalInterest, entries: startDay.entries,
        });
        startDay = day;
        prevDay = day;
        intervalInterest = day.interest;
      }
    }
    intervals.push({
      startDate: startDay.date, endDate: prevDay.date,
      balance: startDay.balance, rate: startDay.rate, style: startDay.style,
      days: dayDiff(startDay.date, prevDay.date) + 1,
      interest: intervalInterest, entries: startDay.entries,
    });
  }

  const rawTotal = intervals.reduce((s, inter) => s + inter.interest, 0);
  const totalInterest = applyRounding(rawTotal, cfg.rounding_method, cfg.rounding_limit);
  const closingBalance = dailyData.length ? dailyData[dailyData.length - 1].balance : openingBalance;

  return { openingBalance, closingBalance, intervals, totalInterest };
};

const buildInterestOutstanding = async (company_id, fy_id, group_name, toDate, fyStart) => {
  const ledgersInGroup = await getLedgerIdsInGroupRecursive(company_id, group_name);
  if (ledgersInGroup.length === 0) {
    return { rows: [], total_principal: 0, total_interest: 0 };
  }

  const active = ledgersInGroup.filter(l => Number(l.activate_interest) === 1 || Number(l.interest_rate) > 0);
  if (active.length === 0) {
    return { rows: [], total_principal: 0, total_interest: 0 };
  }

  const isCreditorSide = group_name === 'Sundry Creditors';
  const byId = new Map(active.map(l => [l.ledger_id, l]));

  const billLedgerIds = active
    .filter(l => (l.interest_calculate_on || 'Bill-by-Bill') !== 'Outstanding Balance')
    .map(l => l.ledger_id);
  const balanceLedgers = active
    .filter(l => (l.interest_calculate_on || 'Bill-by-Bill') === 'Outstanding Balance');

  const resultRows = [];
  let totalPrincipal = 0;
  let totalInterest = 0;

  if (billLedgerIds.length > 0) {
    const bills = await getBillsWithSettlements(company_id, fy_id, { ledger_ids: billLedgerIds, toDate });
    for (const bill of bills) {
      const ledger = byId.get(bill.ledger_id);
      if (!ledger) continue;
      const row = billRow(bill, ledger, toDate, isCreditorSide);
      // A bill matters if money is still pending OR overdue interest accrued
      // before it was (late-)settled.
      if (row.total_pending <= 0.01 && Math.abs(row.interest_amount) <= 0.005 && !row.missing_due_date) continue;
      totalPrincipal += row.total_pending;
      totalInterest += row.interest_amount;
      resultRows.push(row);
    }
  }

  for (const ledger of balanceLedgers) {
    const from = fyStart || toDate;
    const { closingBalance, intervals, totalInterest: ledgerInterestTotal } =
      await computeRunningBalanceInterest(company_id, fy_id, ledger, from, toDate);
    if (Math.abs(closingBalance) <= 0.01 && Math.abs(ledgerInterestTotal) <= 0.005) continue;
    const days = dayDiff(from, toDate);
    totalPrincipal += closingBalance;
    totalInterest += ledgerInterestTotal;
    resultRows.push({
      ledger_id: ledger.ledger_id,
      party_ledger: ledger.name,
      bill_ref: '(On Outstanding Balance)',
      bill_date: from,
      bill_due_date: from,
      total_pending: closingBalance,
      interest_rate: Number(ledger.interest_rate) || 0,
      interest_style: ledger.interest_style || '365-Day Year',
      days,
      interest_amount: ledgerInterestTotal,
      segments: intervals.map(i => ({
        amount: i.balance, rate: i.rate, from: i.startDate, to: i.endDate,
        days: i.days, interest: i.interest,
      })),
      missing_due_date: false,
      "0_30": days <= 30 ? closingBalance : 0,
      "31_60": (days > 30 && days <= 60) ? closingBalance : 0,
      "60": days > 60 ? closingBalance : 0,
    });
  }

  resultRows.sort((a, b) => String(a.party_ledger).localeCompare(String(b.party_ledger)));
  return { rows: resultRows, total_principal: totalPrincipal, total_interest: totalInterest };
};

const fyDates = async (fy_id) => {
  const fyRows = await db.all(sql`SELECT start_date, end_date FROM ${financialYears} WHERE fy_id = ${fy_id}`);
  return {
    start: fyRows?.[0]?.start_date || null,
    end: fyRows?.[0]?.end_date || new Date().toISOString().slice(0, 10),
  };
};

module.exports = {
  interestReceivable: async (company_id, fy_id, params = {}) => {
    try {
      const fy = await fyDates(fy_id);
      const toDate = params.to_date || params.as_on_date || fy.end;
      const fromDate = params.from_date || fy.start;
      const { rows, total_principal, total_interest } =
        await buildInterestOutstanding(company_id, fy_id, 'Sundry Debtors', toDate, fromDate);
      return { success: true, rows, total_principal, total_interest, to_date: toDate, from_date: fromDate };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  interestPayable: async (company_id, fy_id, params = {}) => {
    try {
      const fy = await fyDates(fy_id);
      const toDate = params.to_date || params.as_on_date || fy.end;
      const fromDate = params.from_date || fy.start;
      const { rows, total_principal, total_interest } =
        await buildInterestOutstanding(company_id, fy_id, 'Sundry Creditors', toDate, fromDate);
      return { success: true, rows, total_principal, total_interest, to_date: toDate, from_date: fromDate };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Interest for a single chosen group (the "Groups" option under Interest Calculations).
  groupInterest: async (company_id, fy_id, params = {}) => {
    try {
      const group_id = params.group_id;
      if (!group_id) return { success: false, error: 'group_id is required' };

      const grpRows = await db.all(
        sql`SELECT name, nature FROM ${groups} WHERE group_id = ${group_id} AND company_id = ${company_id} LIMIT 1`
      );
      if (grpRows.length === 0) return { success: false, error: 'Group not found' };
      const group_name = grpRows[0].name;
      const nature = grpRows[0].nature || '';

      const fy = await fyDates(fy_id);
      const toDate = params.to_date || params.as_on_date || fy.end;
      const fromDate = params.from_date || fy.start;

      const { rows, total_principal, total_interest } =
        await buildInterestOutstanding(company_id, fy_id, group_name, toDate, fromDate);
      return { success: true, rows, total_principal, total_interest, to_date: toDate, from_date: fromDate, group_name, nature };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  ledgerInterest: async (company_id, fy_id, params = {}) => {
    try {
      let ledgerId = null;
      if (typeof params === 'object' && params !== null) {
        ledgerId = Number(params.ledger_id || params.ledgerId);
      } else if (params) {
        ledgerId = Number(params);
      }
      if (!ledgerId) {
        const allLedgers = await db.all(sql`
          SELECT ledger_id, name, interest_rate, interest_style, interest_balances, activate_interest
          FROM ${ledgers}
          WHERE company_id = ${company_id} AND is_active = 1
          ORDER BY name ASC
        `);
        return { success: true, picker_mode: true, ledgers: allLedgers };
      }

      const ledgerRows = await db.all(sql`SELECT * FROM ${ledgers} WHERE ledger_id = ${ledgerId} AND company_id = ${company_id}`);
      if (ledgerRows.length === 0) return { success: false, error: 'Ledger not found' };
      const ledger = ledgerRows[0];

      const fy = await fyDates(fy_id);
      const fromDate = params.from_date || fy.start || '2026-04-01';
      const toDate = params.to_date || params.as_on_date || fy.end || '2027-03-31';

      // Bill-wise ledgers (any party ledger not set to "On Outstanding Balance")
      // show one line per bill with its interest-calc breakdown — TallyPrime's
      // Ledger Interest Calculation view. Ledgers configured "On Outstanding
      // Balance" fall through to the running-balance interval view below.
      const isBillWise = (ledger.interest_calculate_on || 'Bill-by-Bill') !== 'Outstanding Balance';
      if (isBillWise) {
        const isCreditor = await isCreditorLedger(company_id, ledgerId);
        const bills = await getBillsWithSettlements(company_id, fy_id, { ledger_ids: [ledgerId], toDate });

        const resultRows = [];
        let totalPrincipal = 0;
        let totalInterest = 0;
        for (const bill of bills) {
          const row = billRow(bill, ledger, toDate, isCreditor);
          if (row.total_pending <= 0.01 && Math.abs(row.interest_amount) <= 0.005 && !row.missing_due_date) continue;
          totalPrincipal += row.total_pending;
          totalInterest += row.interest_amount;
          resultRows.push(row);
        }

        return {
          success: true,
          mode: 'bill-wise',
          ledger,
          fromDate,
          toDate,
          is_creditor: isCreditor,
          rows: resultRows,
          total_principal: totalPrincipal,
          total_interest: totalInterest,
        };
      }

      const { openingBalance, intervals, totalInterest } =
        await computeRunningBalanceInterest(company_id, fy_id, ledger, fromDate, toDate);

      const rows = intervals.map(inter => ({
        date_particulars: `${inter.startDate} to ${inter.endDate}`,
        vch_type: inter.style,
        vch_no: `${inter.days} days`,
        debit: inter.balance >= 0 ? inter.balance : 0,
        credit: inter.balance < 0 ? Math.abs(inter.balance) : 0,
        balance: inter.balance,
        start_date: inter.startDate,
        end_date: inter.endDate,
        rate: inter.rate,
        interest: inter.interest,
        days: inter.days,
      }));

      return {
        success: true,
        mode: 'balance',
        ledger,
        fromDate,
        toDate,
        opening_balance: openingBalance,
        rows,
        total_interest: totalInterest,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  billWiseInterest: async (company_id, fy_id, params = {}) => {
    try {
      let ledgerId = null;
      if (typeof params === 'object' && params !== null) {
        ledgerId = Number(params.ledger_id || params.ledgerId);
      } else if (params) {
        ledgerId = Number(params);
      }
      if (!ledgerId) {
        const allLedgers = await db.all(sql`
          SELECT ledger_id, name, interest_rate, interest_style, interest_balances, activate_interest
          FROM ${ledgers}
          WHERE company_id = ${company_id} AND is_active = 1
          ORDER BY name ASC
        `);
        return { success: true, picker_mode: true, ledgers: allLedgers };
      }

      const ledgerRows = await db.all(sql`SELECT * FROM ${ledgers} WHERE ledger_id = ${ledgerId} AND company_id = ${company_id}`);
      if (ledgerRows.length === 0) return { success: false, error: 'Ledger not found' };
      const ledger = ledgerRows[0];

      const fy = await fyDates(fy_id);
      const toDate = params.to_date || params.as_on_date || fy.end;

      const isCreditor = await isCreditorLedger(company_id, ledgerId);
      const bills = await getBillsWithSettlements(company_id, fy_id, { ledger_ids: [ledgerId], toDate });

      const resultRows = [];
      let totalPrincipal = 0;
      let totalInterest = 0;

      for (const bill of bills) {
        const row = billRow(bill, ledger, toDate, isCreditor);
        if (row.total_pending <= 0.01 && Math.abs(row.interest_amount) <= 0.005 && !row.missing_due_date) continue;
        totalPrincipal += row.total_pending;
        totalInterest += row.interest_amount;
        resultRows.push(row);
      }

      return {
        success: true,
        ledger,
        rows: resultRows,
        total_principal: totalPrincipal,
        total_interest: totalInterest,
        to_date: toDate,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
