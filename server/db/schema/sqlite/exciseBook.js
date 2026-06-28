const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

// Mirrors server/exciseBook/exciseBook.js CREATE TABLE statements (SQLite ground
// truth). A statutory "Excise Book" master (issue #141) is a named master with
// voucher-numbering config plus three multi-row numbering tables — Restart
// Numbering, Prefix Details, Suffix Details. is_active / prevent_duplicates /
// prefill_with_zero are INTEGER 0/1 flags; created_at / updated_at are TEXT ISO
// datetimes.
const exciseBooks = sqliteTable('excise_books', {
  exciseBookId: integer('excise_book_id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull(),
  name: text('name').notNull(),
  alias: text('alias'),
  numberingMethod: text('numbering_method').default('Automatic'),
  preventDuplicates: integer('prevent_duplicates').default(0),
  startingNumber: integer('starting_number').default(1),
  widthOfNumericalPart: integer('width_of_numerical_part').default(0),
  prefillWithZero: integer('prefill_with_zero').default(0),
  usedFor: text('used_for'),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

const exciseBookRestartNumbering = sqliteTable('excise_book_restart_numbering', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exciseBookId: integer('excise_book_id').notNull(),
  applicableFrom: text('applicable_from'),
  startingNumber: integer('starting_number').default(1),
  particulars: text('particulars'),
  sortOrder: integer('sort_order').default(0),
});

const exciseBookPrefixDetails = sqliteTable('excise_book_prefix_details', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exciseBookId: integer('excise_book_id').notNull(),
  applicableFrom: text('applicable_from'),
  particulars: text('particulars'),
  sortOrder: integer('sort_order').default(0),
});

const exciseBookSuffixDetails = sqliteTable('excise_book_suffix_details', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exciseBookId: integer('excise_book_id').notNull(),
  applicableFrom: text('applicable_from'),
  particulars: text('particulars'),
  sortOrder: integer('sort_order').default(0),
});

module.exports = {
  exciseBooks,
  exciseBookRestartNumbering,
  exciseBookPrefixDetails,
  exciseBookSuffixDetails,
};
