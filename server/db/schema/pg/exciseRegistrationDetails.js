const { pgTable, bigint, bigserial, text, integer, real, timestamp } = require('drizzle-orm/pg-core');
const { companies } = require('./company');

// company_id is a plain BIGINT PK (NOT identity) AND a FK to companies(company_id) ON DELETE CASCADE.
const exciseRegistrationDetails = pgTable('excise_registration_details', {
  companyId: bigint('company_id', { mode: 'number' }).primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

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

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const exciseTariffItems = pgTable('excise_tariff_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  tariffName: text('tariff_name').notNull(),
  hsnCode: text('hsn_code'),
  reportingUom: text('reporting_uom'),
  valuationType: text('valuation_type').default('Ad Valorem'),
  rate: real('rate').default(0),
  sortOrder: integer('sort_order').default(0),
});

module.exports = { exciseRegistrationDetails, exciseTariffItems };
