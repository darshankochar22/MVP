// ---------------------------------------------------------------------------
// Excise Book service — Drizzle ORM (clones exciseDutyClassificationService).
//
//   * MUTATIONS use the query builder (db.insert / db.update / db.delete).
//   * READS THAT RETURN ROWS use db.all(sql`SELECT * FROM ${table} ...`) so the
//     legacy snake_case shape (excise_book_id, numbering_method, …) is preserved
//     for the frontend and audit trail.
//
// An excise book is a named master with voucher-numbering config and three
// multi-row numbering tables — Restart Numbering, Prefix Details, Suffix Details:
//   restart_numbering -> excise_book_restart_numbering
//   prefix_details    -> excise_book_prefix_details
//   suffix_details    -> excise_book_suffix_details
// create()/update() persist these atomically (update replaces all child rows).
// ---------------------------------------------------------------------------
const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const {
  exciseBooks,
  exciseBookRestartNumbering,
  exciseBookPrefixDetails,
  exciseBookSuffixDetails,
} = require('../db/schema');

const findRow = async (whereSql) => {
  const rows = await db.all(sql`SELECT * FROM ${exciseBooks} WHERE ${whereSql}`);
  return rows[0];
};

// ── Restart Numbering rows ──────────────────────────────────────────────────
const loadRestart = async (id) => {
  const rows = await db.all(
    sql`SELECT * FROM ${exciseBookRestartNumbering}
        WHERE ${exciseBookRestartNumbering.exciseBookId} = ${id}
        ORDER BY ${exciseBookRestartNumbering.sortOrder}, ${exciseBookRestartNumbering.id}`
  );
  return rows.map((r) => ({
    applicable_from: r.applicable_from ?? '',
    starting_number: r.starting_number ?? 1,
    particulars: r.particulars ?? '',
  }));
};

const insertRestart = async (id, list) => {
  const rows = (list || [])
    .filter((r) => r && ((r.applicable_from || '').trim() || (r.particulars || '').trim()))
    .map((r, i) => ({
      exciseBookId: id,
      applicableFrom: (r.applicable_from || '').trim() || null,
      startingNumber: Number.isFinite(Number(r.starting_number)) ? Number(r.starting_number) : 1,
      particulars: (r.particulars || '').trim() || null,
      sortOrder: i,
    }));
  if (rows.length) await db.insert(exciseBookRestartNumbering).values(rows);
};

const deleteRestart = async (id) =>
  db.delete(exciseBookRestartNumbering).where(eq(exciseBookRestartNumbering.exciseBookId, id));

// ── Prefix / Suffix rows (same shape) ───────────────────────────────────────
const loadAffix = async (table, id) => {
  const rows = await db.all(
    sql`SELECT * FROM ${table}
        WHERE ${table.exciseBookId} = ${id}
        ORDER BY ${table.sortOrder}, ${table.id}`
  );
  return rows.map((r) => ({
    applicable_from: r.applicable_from ?? '',
    particulars: r.particulars ?? '',
  }));
};

const insertAffix = async (table, id, list) => {
  const rows = (list || [])
    .filter((r) => r && ((r.applicable_from || '').trim() || (r.particulars || '').trim()))
    .map((r, i) => ({
      exciseBookId: id,
      applicableFrom: (r.applicable_from || '').trim() || null,
      particulars: (r.particulars || '').trim() || null,
      sortOrder: i,
    }));
  if (rows.length) await db.insert(table).values(rows);
};

const deleteAffix = async (table, id) =>
  db.delete(table).where(eq(table.exciseBookId, id));

// Load every child list for an excise book.
const loadChildren = async (id) => ({
  restart_numbering: await loadRestart(id),
  prefix_details: await loadAffix(exciseBookPrefixDetails, id),
  suffix_details: await loadAffix(exciseBookSuffixDetails, id),
});

// Replace every child list for an excise book.
const replaceChildren = async (id, data) => {
  if (data.restart_numbering !== undefined) {
    await deleteRestart(id);
    await insertRestart(id, data.restart_numbering);
  }
  if (data.prefix_details !== undefined) {
    await deleteAffix(exciseBookPrefixDetails, id);
    await insertAffix(exciseBookPrefixDetails, id, data.prefix_details);
  }
  if (data.suffix_details !== undefined) {
    await deleteAffix(exciseBookSuffixDetails, id);
    await insertAffix(exciseBookSuffixDetails, id, data.suffix_details);
  }
};

module.exports = {
  create: async (data) => {
    try {
      const exists = await db.all(
        sql`SELECT * FROM ${exciseBooks}
            WHERE ${exciseBooks.companyId} = ${data.company_id}
              AND LOWER(${exciseBooks.name}) = LOWER(${data.name})
              AND ${exciseBooks.isActive} = 1`
      );
      if (exists.length > 0) return { success: false, error: 'Excise Book already exists' };

      const inserted = await db
        .insert(exciseBooks)
        .values({
          companyId: data.company_id,
          name: data.name,
          alias: data.alias ?? null,
          numberingMethod: data.numbering_method ?? 'Automatic',
          preventDuplicates: data.prevent_duplicates ? 1 : 0,
          startingNumber: Number.isFinite(Number(data.starting_number)) ? Number(data.starting_number) : 1,
          widthOfNumericalPart: Number.isFinite(Number(data.width_of_numerical_part)) ? Number(data.width_of_numerical_part) : 0,
          prefillWithZero: data.prefill_with_zero ? 1 : 0,
          usedFor: data.used_for ?? null,
          isActive: 1,
        })
        .returning({ id: exciseBooks.exciseBookId });

      const id = inserted[0].id;
      await replaceChildren(id, data);

      const exciseBook = await findRow(sql`${exciseBooks.exciseBookId} = ${id}`);
      const children = await loadChildren(id);
      return { success: true, exciseBook: { ...exciseBook, ...children } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const rows = await db.all(
        sql`SELECT * FROM ${exciseBooks}
            WHERE ${exciseBooks.companyId} = ${company_id}
              AND ${exciseBooks.isActive} = 1`
      );
      const exciseBooksList = await Promise.all(
        rows.map(async (r) => ({ ...r, ...(await loadChildren(r.excise_book_id)) }))
      );
      return { success: true, exciseBooks: exciseBooksList };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const exciseBook = await findRow(sql`${exciseBooks.exciseBookId} = ${id}`);
      if (!exciseBook) return { success: false, error: 'Excise Book not found' };
      const children = await loadChildren(id);
      return { success: true, exciseBook: { ...exciseBook, ...children } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const current = await findRow(sql`${exciseBooks.exciseBookId} = ${data.excise_book_id}`);
      if (!current) return { success: false, error: 'Excise Book not found' };

      await db
        .update(exciseBooks)
        .set({
          name: data.name ?? current.name,
          alias: data.alias !== undefined ? data.alias : current.alias,
          numberingMethod: data.numbering_method ?? current.numbering_method,
          preventDuplicates: data.prevent_duplicates !== undefined ? (data.prevent_duplicates ? 1 : 0) : current.prevent_duplicates,
          startingNumber: data.starting_number !== undefined ? Number(data.starting_number) : current.starting_number,
          widthOfNumericalPart: data.width_of_numerical_part !== undefined ? Number(data.width_of_numerical_part) : current.width_of_numerical_part,
          prefillWithZero: data.prefill_with_zero !== undefined ? (data.prefill_with_zero ? 1 : 0) : current.prefill_with_zero,
          usedFor: data.used_for !== undefined ? data.used_for : current.used_for,
          updatedAt: sql`datetime('now')`,
        })
        .where(eq(exciseBooks.exciseBookId, data.excise_book_id));

      await replaceChildren(data.excise_book_id, data);

      const exciseBook = await findRow(sql`${exciseBooks.exciseBookId} = ${data.excise_book_id}`);
      const children = await loadChildren(data.excise_book_id);
      return { success: true, exciseBook: { ...exciseBook, ...children } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const existing = await findRow(sql`${exciseBooks.exciseBookId} = ${id}`);
      if (!existing) return { success: false, error: 'Excise Book not found' };

      await db.update(exciseBooks).set({ isActive: 0 }).where(eq(exciseBooks.exciseBookId, id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
