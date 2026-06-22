const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { ledgers, groups } = require('../../db/schema');
const { getEntries } = require('../utils/reportDb');
const { calcLedgerBalance } = require('../utils/ledgerBalance');

const balanceSheet = async (company_id, fy_id) => {
  try {
    const entries = await getEntries(company_id, fy_id);

    const ledgerRows = await db.all(
      sql`SELECT l.ledger_id, l.name, l.opening_balance, l.opening_balance_type, l.group_id,
                 g.nature
          FROM ${ledgers} l
          INNER JOIN ${groups} g ON g.group_id = l.group_id
          WHERE l.company_id = ${company_id} AND l.is_active = 1`
    );

    // Internal raw (signed, Dr +) balance per ledger of a given nature.
    const rawByNature = (nature) => ledgerRows
      .filter(l => l.nature === nature)
      .map(l => ({
        ledger_id: l.ledger_id,
        ledger_name: l.name,
        balance: calcLedgerBalance(l.ledger_id, entries, l.opening_balance || 0, l.opening_balance_type || 'Dr'),
      }));

    // Assets carry debit (positive) balances; liabilities carry credit
    // balances, presented as positive figures (-rawBalance).
    const assets = rawByNature('Assets')
      .filter(l => l.balance !== 0);
    const liabilities = rawByNature('Liabilities')
      .map(l => ({ ...l, balance: -l.balance }))
      .filter(l => l.balance !== 0);

    // Current-year profit/loss MUST appear on the balance sheet, otherwise it
    // cannot tie out. Income is credit (-raw), expense is debit (+raw).
    const sumRaw = (nature) => rawByNature(nature).reduce((s, l) => s + l.balance, 0);
    const netProfit = (-sumRaw('Income')) - sumRaw('Expenses');

    const totalAssets = assets.reduce((s, l) => s + l.balance, 0);
    let totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0);

    // Append the P&L result as a reserves line on the liabilities side.
    if (Math.abs(netProfit) >= 0.001) {
      liabilities.push({
        ledger_id: null,
        ledger_name: netProfit >= 0 ? 'Profit & Loss A/c (Current Year)' : 'Profit & Loss A/c (Loss, Current Year)',
        balance: netProfit,
        is_pl_account: true,
      });
      totalLiabilities += netProfit;
    }

    return {
      success: true,
      assets,
      liabilities,
      totalAssets,
      totalLiabilities,
      netProfit,
      difference: Number((totalAssets - totalLiabilities).toFixed(2)),
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { balanceSheet };