const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

// Mirrors server/exciseDutyClassification/exciseDutyClassification.js CREATE TABLE
// statement (SQLite ground truth). A statutory "Excise Duty Classification" master
// (issue #140) carries a name, a duty_code (picked from the List of Excise Duty
// Codes) and a calculation_method (On Assessable Value / Basic Excise Duty).
// is_active is an INTEGER 0/1 flag; created_at / updated_at are TEXT ISO datetimes.
const exciseDutyClassifications = sqliteTable('excise_duty_classifications', {
  exciseDutyClassificationId: integer('excise_duty_classification_id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull(),
  name: text('name').notNull(),
  dutyCode: text('duty_code'),
  calculationMethod: text('calculation_method'),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

module.exports = {
  exciseDutyClassifications,
};
