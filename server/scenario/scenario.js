// Scenario master (TallyPrime Accounting Master, issue #136).
// A scenario has a name, an "include actuals" flag, and two voucher-type sets
// entered through the Include / Exclude lists on the creation screen:
//   * include vouchers -> scenario_include_vouchers
//   * exclude vouchers -> scenario_exclude_vouchers
// Child rows are removed via ON DELETE CASCADE when the parent scenario is hard
// deleted; soft delete (is_active = 0) leaves them intact.
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS scenarios (
      scenario_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id      INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      include_actuals INTEGER DEFAULT 1,
      is_active       INTEGER DEFAULT 1,
      is_predefined   INTEGER DEFAULT 0,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS scenario_include_vouchers (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id     INTEGER NOT NULL REFERENCES scenarios(scenario_id) ON DELETE CASCADE,
      voucher_type_id INTEGER NOT NULL REFERENCES voucher_types(vt_id),
      vouchers_mode   TEXT DEFAULT 'Optional Vouchers Only'
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS scenario_exclude_vouchers (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      scenario_id     INTEGER NOT NULL REFERENCES scenarios(scenario_id) ON DELETE CASCADE,
      voucher_type_id INTEGER NOT NULL REFERENCES voucher_types(vt_id),
      vouchers_mode   TEXT DEFAULT 'Optional Vouchers Only'
    )
  `);
};

module.exports = { init };
