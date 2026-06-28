const { pgTable, bigint, bigserial, text, integer, real, timestamp } = require('drizzle-orm/pg-core');
const { companies } = require('./company');

// company_id is a plain BIGINT PK (NOT identity) AND a FK to companies(company_id) ON DELETE CASCADE.
const vatRegistrationDetails = pgTable('vat_registration_details', {
  companyId: bigint('company_id', { mode: 'number' }).primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  state: text('state'),
  tin: text('tin'),
  interstateSalesTaxNumber: text('interstate_sales_tax_number'),
  setAlterTaxRateDetails: integer('set_alter_tax_rate_details').default(0),
  taxRate: real('tax_rate').default(0),
  taxType: text('tax_type').default('Unknown'),
  defineVatCommodityAsMasters: integer('define_vat_commodity_as_masters').default(0),
  deactivateFrom: text('deactivate_from'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const vatCommodities = pgTable('vat_commodities', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  rate: real('rate').default(0),
  taxType: text('tax_type').default('Unknown'),
  sortOrder: integer('sort_order').default(0),
});

module.exports = { vatRegistrationDetails, vatCommodities };
