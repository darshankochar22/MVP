const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { ledgers, groups } = require('../../db/schema');
const { getEntries } = require('../utils/reportDb');
const { calcLedgerBalance } = require('../utils/ledgerBalance');

const profitLoss = async (company_id, fy_id) => {
  try {
    const entries = await getEntries(company_id, fy_id);

    const ledgerRows = await db.all(
      sql`SELECT l.ledger_id, l.name, l.opening_balance, l.opening_balance_type, l.group_id,
                 g.nature
          FROM ${ledgers} l
          INNER JOIN ${groups} g ON g.group_id = l.group_id
          WHERE l.company_id = ${company_id} AND l.is_active = 1`
    );

    const getLedgersByNature = (nature) => ledgerRows
      .filter(l => l.nature === nature)
      .map(l => {
        const raw = calcLedgerBalance(l.ledger_id, entries, l.opening_balance || 0, l.opening_balance_type || 'Dr');
        return {
          ledger_id: l.ledger_id,
          ledger_name: l.name,
          balance: nature === 'Income' ? -raw : raw,
        };
      })
      .filter(l => l.balance !== 0);

    const income   = getLedgersByNature('Income');
    const expenses = getLedgersByNature('Expenses');

    const totalIncome   = income.reduce((s, l) => s + l.balance, 0);
    const totalExpenses = expenses.reduce((s, l) => s + l.balance, 0);
    const netProfit     = totalIncome - totalExpenses;

    return {
      success: true,
      income, expenses,
      totalIncome, totalExpenses,
      netProfit, isProfit: netProfit >= 0,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { profitLoss };