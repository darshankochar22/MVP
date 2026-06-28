const { sqliteTable, integer, text, real } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');
const { companies } = require('./company');

// Mirrors server/exciseRegistrationDetails/exciseRegistrationDetails.js CREATE TABLE.
// One row per company; PK == company_id, which is also a FK to companies(company_id).
const exciseRegistrationDetails = sqliteTable('excise_registration_details', {
  companyId: integer('company_id').primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  unitName: text('unit_name'),
  address: text('address'),
  state: text('state'),
  pincode: text('pincode'),
  telephoneNo: text('telephone_no'),
  registrationType: text('registration_type').default('Dealer'),
  eccNumber: text('ecc_number'),
  setAlterExciseTariffDetails: integer('set_alter_excise_tariff_details').default(0),
  defineExciseTariffAsMasters: integer('define_excise_tariff_as_masters').default(0),
  deactivateFrom: text('deactivate_from'),

  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// Optional "Define excise tariff and duty details as masters" list.
const exciseTariffItems = sqliteTable('excise_tariff_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  tariffName: text('tariff_name').notNull(),
  hsnCode: text('hsn_code'),
  reportingUom: text('reporting_uom'),
  valuationType: text('valuation_type').default('Ad Valorem'),
  rate: real('rate').default(0),
  sortOrder: integer('sort_order').default(0),
});

module.exports = { exciseRegistrationDetails, exciseTariffItems };
