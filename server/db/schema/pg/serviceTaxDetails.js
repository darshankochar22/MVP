const { pgTable, bigint, bigserial, text, integer, real, timestamp } = require('drizzle-orm/pg-core');
const { companies } = require('./company');

// company_id is a plain BIGINT PK (NOT identity) AND a FK to companies(company_id) ON DELETE CASCADE.
const serviceTaxDetails = pgTable('service_tax_details', {
  companyId: bigint('company_id', { mode: 'number' }).primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  serviceTaxRegistrationNumber: text('service_tax_registration_number'),
  typeOfOrganisation: text('type_of_organisation').default('Individual/Proprietory/One Person Company'),
  isMonthlyFormat: integer('is_monthly_format').default(0),
  computeTaxLiabilityBasedOn: text('compute_tax_liability_based_on').default('Accrual'),
  setAlterServiceTaxDetails: integer('set_alter_service_tax_details').default(0),
  taxLiabilityApplicableFrom: text('tax_liability_applicable_from'),
  defineServiceCategoryAsMasters: integer('define_service_category_as_masters').default(0),
  isReverseChargeApplicable: integer('is_reverse_charge_applicable').default(0),
  deactivateFrom: text('deactivate_from'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const serviceTaxCategories = pgTable('service_tax_categories', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  serviceTaxRate: real('service_tax_rate').default(0),
  educationCessRate: real('education_cess_rate').default(0),
  secondaryEducationCessRate: real('secondary_education_cess_rate').default(0),
  swachhBharatCessRate: real('swachh_bharat_cess_rate').default(0),
  krishiKalyanCessRate: real('krishi_kalyan_cess_rate').default(0),
  sortOrder: integer('sort_order').default(0),
});

module.exports = { serviceTaxDetails, serviceTaxCategories };
