const { pgTable, bigserial, bigint, text, integer, timestamp } = require('drizzle-orm/pg-core');
const { companies } = require('./company');

const merchantProfiles = pgTable('merchant_profiles', {
  merchantProfileId: bigserial('merchant_profile_id', { mode: 'number' }).primaryKey(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  paymentMethod: text('payment_method').default('UPI'),
  isActive: integer('is_active').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

module.exports = { merchantProfiles };
