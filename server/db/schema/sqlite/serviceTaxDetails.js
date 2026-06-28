const { sqliteTable, integer, text, real } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');
const { companies } = require('./company');

// Mirrors server/serviceTaxDetails/serviceTaxDetails.js CREATE TABLE.
// One row per company; PK == company_id, which is also a FK to companies(company_id).
const serviceTaxDetails = sqliteTable('service_tax_details', {
  companyId: integer('company_id').primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  serviceTaxRegistrationNumber: text('service_tax_registration_number'),
  typeOfOrganisation: text('type_of_organisation').default('Individual/Proprietory/One Person Company'),
  isMonthlyFormat: integer('is_monthly_format').default(0),
  computeTaxLiabilityBasedOn: text('compute_tax_liability_based_on').default('Accrual'),
  setAlterServiceTaxDetails: integer('set_alter_service_tax_details').default(0),
  taxLiabilityApplicableFrom: text('tax_liability_applicable_from'),
  defineServiceCategoryAsMasters: integer('define_service_category_as_masters').default(0),
  isReverseChargeApplicable: integer('is_reverse_charge_applicable').default(0),
  deactivateFrom: text('deactivate_from'),

  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// Optional "Define service category and tax details as masters" list.
const serviceTaxCategories = sqliteTable('service_tax_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  serviceTaxRate: real('service_tax_rate').default(0),
  educationCessRate: real('education_cess_rate').default(0),
  secondaryEducationCessRate: real('secondary_education_cess_rate').default(0),
  swachhBharatCessRate: real('swachh_bharat_cess_rate').default(0),
  krishiKalyanCessRate: real('krishi_kalyan_cess_rate').default(0),
  sortOrder: integer('sort_order').default(0),
});

module.exports = { serviceTaxDetails, serviceTaxCategories };
