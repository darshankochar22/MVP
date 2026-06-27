// Payroll Statutory Details — singleton config (one row per company).
// Mirrors companyGstDetails: company_id is the PK and a FK to companies.
// Holds the Provident Fund, ESI, National Pension Scheme & Income Tax details
// used in Challan, Forms & Returns (Issue #142).
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS payroll_statutory_details (
      company_id                          INTEGER PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,

      pf_company_code                     TEXT,
      pf_account_group_code               TEXT,
      pf_security_code                    TEXT,

      esi_company_code                    TEXT,
      esi_branch_office                   TEXT,
      esi_standard_working_days           INTEGER DEFAULT 0,

      nps_corporate_registration_number   TEXT,
      nps_corporate_branch_office_number  TEXT,

      it_tan                              TEXT,
      it_tan_registration_number          TEXT,
      it_circle_or_ward                   TEXT,
      it_deductor_type                    TEXT DEFAULT 'Government',
      it_deductor_branch_division         TEXT,
      it_person_responsible_name          TEXT,
      it_person_responsible_relation      TEXT,
      it_designation                      TEXT,
      it_pan                              TEXT,

      created_at                          TEXT DEFAULT (datetime('now')),
      updated_at                          TEXT DEFAULT (datetime('now'))
    )
  `);
};

module.exports = { init };
