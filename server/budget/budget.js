// Budget master (TallyPrime Accounting Master, issue #135).
// A budget has a name, an optional parent budget (Secondary when set), a
// period (from/to), and three kinds of allocations entered through sub-screens:
//   * group budgets        -> budget_group_allocations
//   * ledger budgets       -> budget_ledger_allocations
//   * cost centre budgets  -> budget_cost_centre_allocations
// Child rows are removed via ON DELETE CASCADE when the parent budget is hard
// deleted; soft delete (is_active = 0) leaves them intact.
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS budgets (
      budget_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id    INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      parent_id     INTEGER REFERENCES budgets(budget_id),
      period_from   TEXT,
      period_to     TEXT,
      is_active     INTEGER DEFAULT 1,
      is_predefined INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS budget_group_allocations (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_id      INTEGER NOT NULL REFERENCES budgets(budget_id) ON DELETE CASCADE,
      group_id       INTEGER NOT NULL REFERENCES groups(group_id),
      cost_centre_id INTEGER REFERENCES cost_centres(cc_id),
      type_of_budget TEXT DEFAULT 'On Closing Balance',
      amount         REAL DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS budget_ledger_allocations (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_id      INTEGER NOT NULL REFERENCES budgets(budget_id) ON DELETE CASCADE,
      ledger_id      INTEGER NOT NULL REFERENCES ledgers(ledger_id),
      cost_centre_id INTEGER REFERENCES cost_centres(cc_id),
      type_of_budget TEXT DEFAULT 'On Closing Balance',
      amount         REAL DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS budget_cost_centre_allocations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_id       INTEGER NOT NULL REFERENCES budgets(budget_id) ON DELETE CASCADE,
      cost_centre_id  INTEGER NOT NULL REFERENCES cost_centres(cc_id),
      expenses        REAL DEFAULT 0,
      income          REAL DEFAULT 0,
      closing_balance REAL DEFAULT 0
    )
  `);
};

module.exports = { init };
