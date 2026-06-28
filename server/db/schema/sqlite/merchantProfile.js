const { sqliteTable, integer, text } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');
const { companies } = require('./company');

// Mirrors server/merchantProfile/merchantProfile.js CREATE TABLE.
const merchantProfiles = sqliteTable('merchant_profiles', {
  merchantProfileId: integer('merchant_profile_id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  paymentMethod: text('payment_method').default('UPI'),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

module.exports = { merchantProfiles };
