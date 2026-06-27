const { sqliteTable, integer, text } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');
const { companies } = require('./company');

// Mirrors server/payrollStatutoryDetails/payrollStatutoryDetails.js CREATE TABLE.
// One row per company; PK == company_id, which is also a FK to companies(company_id).
const payrollStatutoryDetails = sqliteTable('payroll_statutory_details', {
  companyId: integer('company_id').primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  pfCompanyCode: text('pf_company_code'),
  pfAccountGroupCode: text('pf_account_group_code'),
  pfSecurityCode: text('pf_security_code'),

  esiCompanyCode: text('esi_company_code'),
  esiBranchOffice: text('esi_branch_office'),
  esiStandardWorkingDays: integer('esi_standard_working_days').default(0),

  npsCorporateRegistrationNumber: text('nps_corporate_registration_number'),
  npsCorporateBranchOfficeNumber: text('nps_corporate_branch_office_number'),

  itTan: text('it_tan'),
  itTanRegistrationNumber: text('it_tan_registration_number'),
  itCircleOrWard: text('it_circle_or_ward'),
  itDeductorType: text('it_deductor_type').default('Government'),
  itDeductorBranchDivision: text('it_deductor_branch_division'),
  itPersonResponsibleName: text('it_person_responsible_name'),
  itPersonResponsibleRelation: text('it_person_responsible_relation'),
  itDesignation: text('it_designation'),
  itPan: text('it_pan'),

  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

module.exports = { payrollStatutoryDetails };
