// Service Tax Details — singleton config (one row per company) + service
// category masters (Issue #146).
// Mirrors payrollStatutoryDetails: company_id is the PK and a FK to companies.
// `service_tax_categories` holds the optional "Define service category and tax
// details as masters" list, each row carrying its cess rate breakup.
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS service_tax_details (
      company_id                          INTEGER PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,

      service_tax_registration_number     TEXT,
      type_of_organisation                TEXT DEFAULT 'Individual/Proprietory/One Person Company',
      is_monthly_format                   INTEGER DEFAULT 0,
      compute_tax_liability_based_on       TEXT DEFAULT 'Accrual',
      set_alter_service_tax_details        INTEGER DEFAULT 0,
      tax_liability_applicable_from        TEXT,
      define_service_category_as_masters   INTEGER DEFAULT 0,
      is_reverse_charge_applicable         INTEGER DEFAULT 0,
      deactivate_from                      TEXT,

      created_at                          TEXT DEFAULT (datetime('now')),
      updated_at                          TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS service_tax_categories (
      id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id                          INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name                                TEXT NOT NULL,
      service_tax_rate                    REAL DEFAULT 0,
      education_cess_rate                 REAL DEFAULT 0,
      secondary_education_cess_rate        REAL DEFAULT 0,
      swachh_bharat_cess_rate              REAL DEFAULT 0,
      krishi_kalyan_cess_rate              REAL DEFAULT 0,
      sort_order                          INTEGER DEFAULT 0
    )
  `);
};

module.exports = { init };
