const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS company_gst_details (
      gst_details_id              INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id                  INTEGER NOT NULL UNIQUE REFERENCES companies(company_id) ON DELETE CASCADE,
      gstin                       TEXT,
      registration_type           TEXT DEFAULT 'Regular',
      state_name                  TEXT,
      applicable_from             TEXT,
      periodicity_of_gstr1        TEXT DEFAULT 'Monthly',
      assessee_of_other_territory INTEGER DEFAULT 0,
      enable_e_invoice            INTEGER DEFAULT 0,
      e_invoice_applicable_from   TEXT,
      enable_e_way_bill           INTEGER DEFAULT 0,
      e_way_bill_applicable_from  TEXT,
      e_way_bill_for_intrastate   INTEGER DEFAULT 0,
      hsn_sac_details             TEXT DEFAULT 'Not Defined',
      hsn_sac                     TEXT,
      description                 TEXT,
      gst_rate_details            TEXT DEFAULT 'Not Defined',
      taxability_type             TEXT,
      gst_rate                    REAL DEFAULT 0,
      hsn_summary_for             TEXT DEFAULT 'All Sections',
      min_hsn_sac_length          INTEGER DEFAULT 4,
      show_gst_advances           INTEGER DEFAULT 0,
      update_gst_on_master_alter  INTEGER DEFAULT 0,
      set_alter_gst_return_details INTEGER DEFAULT 0,
      is_active                   INTEGER DEFAULT 1,
      created_at                  TEXT DEFAULT (datetime('now')),
      updated_at                  TEXT DEFAULT (datetime('now'))
    )
  `);

  const migrations = [
    { col: 'hsn_sac_details',            sql: "ALTER TABLE company_gst_details ADD COLUMN hsn_sac_details TEXT DEFAULT 'Not Defined'" },
    { col: 'hsn_sac',                    sql: "ALTER TABLE company_gst_details ADD COLUMN hsn_sac TEXT" },
    { col: 'description',                sql: "ALTER TABLE company_gst_details ADD COLUMN description TEXT" },
    { col: 'gst_rate_details',           sql: "ALTER TABLE company_gst_details ADD COLUMN gst_rate_details TEXT DEFAULT 'Not Defined'" },
    { col: 'taxability_type',            sql: "ALTER TABLE company_gst_details ADD COLUMN taxability_type TEXT" },
    { col: 'gst_rate',                   sql: "ALTER TABLE company_gst_details ADD COLUMN gst_rate REAL DEFAULT 0" },
    { col: 'hsn_summary_for',            sql: "ALTER TABLE company_gst_details ADD COLUMN hsn_summary_for TEXT DEFAULT 'All Sections'" },
    { col: 'min_hsn_sac_length',         sql: "ALTER TABLE company_gst_details ADD COLUMN min_hsn_sac_length INTEGER DEFAULT 4" },
    { col: 'show_gst_advances',          sql: "ALTER TABLE company_gst_details ADD COLUMN show_gst_advances INTEGER DEFAULT 0" },
    { col: 'update_gst_on_master_alter', sql: "ALTER TABLE company_gst_details ADD COLUMN update_gst_on_master_alter INTEGER DEFAULT 0" },
    { col: 'set_alter_gst_return_details', sql: "ALTER TABLE company_gst_details ADD COLUMN set_alter_gst_return_details INTEGER DEFAULT 0" },
  ];

  for (const m of migrations) {
    try {
      await db.execute(m.sql);
    } catch (err) {
      // column already exists — ignore
    }
  }
};

module.exports = { init };
