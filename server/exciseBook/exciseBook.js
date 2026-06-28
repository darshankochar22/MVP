// Excise Book master (TallyPrime Statutory Master, issue #141).
// A named master (multiple excise books) carrying voucher-numbering config:
// name/alias, method of numbering, prevent-duplicates, starting number, width of
// numerical part, prefill-with-zero, and a "Used for" label. Three multi-row
// numbering tables hang off it — Restart Numbering, Prefix Details and Suffix
// Details -> excise_book_restart_numbering / excise_book_prefix_details /
// excise_book_suffix_details. Child rows are removed via ON DELETE CASCADE when
// the parent is hard deleted; soft delete (is_active = 0) leaves them intact.
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS excise_books (
      excise_book_id          INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id              INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name                    TEXT NOT NULL,
      alias                   TEXT,
      numbering_method        TEXT DEFAULT 'Automatic',
      prevent_duplicates      INTEGER DEFAULT 0,
      starting_number         INTEGER DEFAULT 1,
      width_of_numerical_part INTEGER DEFAULT 0,
      prefill_with_zero       INTEGER DEFAULT 0,
      used_for                TEXT,
      is_active               INTEGER DEFAULT 1,
      created_at              TEXT DEFAULT (datetime('now')),
      updated_at              TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS excise_book_restart_numbering (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      excise_book_id  INTEGER NOT NULL REFERENCES excise_books(excise_book_id) ON DELETE CASCADE,
      applicable_from TEXT,
      starting_number INTEGER DEFAULT 1,
      particulars     TEXT,
      sort_order      INTEGER DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS excise_book_prefix_details (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      excise_book_id  INTEGER NOT NULL REFERENCES excise_books(excise_book_id) ON DELETE CASCADE,
      applicable_from TEXT,
      particulars     TEXT,
      sort_order      INTEGER DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS excise_book_suffix_details (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      excise_book_id  INTEGER NOT NULL REFERENCES excise_books(excise_book_id) ON DELETE CASCADE,
      applicable_from TEXT,
      particulars     TEXT,
      sort_order      INTEGER DEFAULT 0
    )
  `);
};

module.exports = { init };
