const { sqliteTable, integer, text, real } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');
const { companies } = require('./company');

// Mirrors server/vatRegistrationDetails/vatRegistrationDetails.js CREATE TABLE.
// One row per company; PK == company_id, which is also a FK to companies(company_id).
const vatRegistrationDetails = sqliteTable('vat_registration_details', {
  companyId: integer('company_id').primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  state: text('state'),
  tin: text('tin'),
  interstateSalesTaxNumber: text('interstate_sales_tax_number'),
  setAlterTaxRateDetails: integer('set_alter_tax_rate_details').default(0),
  taxRate: real('tax_rate').default(0),
  taxType: text('tax_type').default('Unknown'),
  defineVatCommodityAsMasters: integer('define_vat_commodity_as_masters').default(0),
  deactivateFrom: text('deactivate_from'),

  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// Optional "Define VAT commodity and tax details as masters" list.
const vatCommodities = sqliteTable('vat_commodities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  rate: real('rate').default(0),
  taxType: text('tax_type').default('Unknown'),
  sortOrder: integer('sort_order').default(0),
});

module.exports = { vatRegistrationDetails, vatCommodities };
