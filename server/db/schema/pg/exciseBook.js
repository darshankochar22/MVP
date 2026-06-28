const { pgTable, bigint, bigserial, text, integer, timestamp } = require('drizzle-orm/pg-core');
const { companies } = require('./company');

// PG mirror of the SQLite "Excise Book" master (issue #141). A named master with
// voucher-numbering config plus three multi-row numbering tables — Restart
// Numbering, Prefix Details, Suffix Details. excise_book_id is a bigserial PK;
// company_id is a BIGINT FK to companies(company_id) ON DELETE CASCADE.
const exciseBooks = pgTable('excise_books', {
  exciseBookId: bigserial('excise_book_id', { mode: 'number' }).primaryKey(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  alias: text('alias'),
  numberingMethod: text('numbering_method').default('Automatic'),
  preventDuplicates: integer('prevent_duplicates').default(0),
  startingNumber: integer('starting_number').default(1),
  widthOfNumericalPart: integer('width_of_numerical_part').default(0),
  prefillWithZero: integer('prefill_with_zero').default(0),
  usedFor: text('used_for'),
  isActive: integer('is_active').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const exciseBookRestartNumbering = pgTable('excise_book_restart_numbering', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  exciseBookId: bigint('excise_book_id', { mode: 'number' }).notNull().references(() => exciseBooks.exciseBookId, { onDelete: 'cascade' }),
  applicableFrom: text('applicable_from'),
  startingNumber: integer('starting_number').default(1),
  particulars: text('particulars'),
  sortOrder: integer('sort_order').default(0),
});

const exciseBookPrefixDetails = pgTable('excise_book_prefix_details', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  exciseBookId: bigint('excise_book_id', { mode: 'number' }).notNull().references(() => exciseBooks.exciseBookId, { onDelete: 'cascade' }),
  applicableFrom: text('applicable_from'),
  particulars: text('particulars'),
  sortOrder: integer('sort_order').default(0),
});

const exciseBookSuffixDetails = pgTable('excise_book_suffix_details', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  exciseBookId: bigint('excise_book_id', { mode: 'number' }).notNull().references(() => exciseBooks.exciseBookId, { onDelete: 'cascade' }),
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
