// Excise Duty Classification master (TallyPrime Statutory Master, issue #140).
// A classification has a name, a duty code (chosen from the List of Excise Duty
// Codes — e.g. CENVAT, EDU_CESS, NCCD …) and a calculation method
// ("On Assessable Value" / "Basic Excise Duty"). Single flat table, soft deleted
// via is_active = 0.
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS excise_duty_classifications (
      excise_duty_classification_id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id          INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name                TEXT NOT NULL,
      duty_code           TEXT,
      calculation_method  TEXT,
      is_active           INTEGER DEFAULT 1,
      created_at          TEXT DEFAULT (datetime('now')),
      updated_at          TEXT DEFAULT (datetime('now'))
    )
  `);
};

module.exports = { init };
