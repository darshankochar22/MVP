const { pgTable, bigint, text, integer, timestamp } = require('drizzle-orm/pg-core');
const { companies } = require('./company');

// company_id is a plain BIGINT PK (NOT identity) AND a FK to companies(company_id) ON DELETE CASCADE.
const payrollStatutoryDetails = pgTable('payroll_statutory_details', {
  companyId: bigint('company_id', { mode: 'number' }).primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

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

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

module.exports = { payrollStatutoryDetails };
