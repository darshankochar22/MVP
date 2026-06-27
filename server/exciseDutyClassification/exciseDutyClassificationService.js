// ---------------------------------------------------------------------------
// Excise Duty Classification service — Drizzle ORM (follows the scenarioService
// exemplar, simplified: a single flat table with no child rows).
//
//   * MUTATIONS use the query builder (db.insert / db.update).
//   * READS THAT RETURN ROWS use db.all(sql`SELECT * FROM ${table} ...`) so the
//     legacy snake_case shape (excise_duty_classification_id, duty_code, …) is
//     preserved for the frontend and audit trail.
// ---------------------------------------------------------------------------
const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const { exciseDutyClassifications } = require('../db/schema');

const findRow = async (whereSql) => {
  const rows = await db.all(sql`SELECT * FROM ${exciseDutyClassifications} WHERE ${whereSql}`);
  return rows[0];
};

module.exports = {
  create: async (data) => {
    try {
      const exists = await db.all(
        sql`SELECT * FROM ${exciseDutyClassifications}
            WHERE ${exciseDutyClassifications.companyId} = ${data.company_id}
              AND LOWER(${exciseDutyClassifications.name}) = LOWER(${data.name})
              AND ${exciseDutyClassifications.isActive} = 1`
      );
      if (exists.length > 0) return { success: false, error: 'Excise Duty Classification already exists' };

      const inserted = await db
        .insert(exciseDutyClassifications)
        .values({
          companyId: data.company_id,
          name: data.name,
          dutyCode: data.duty_code ?? null,
          calculationMethod: data.calculation_method ?? null,
          isActive: 1,
        })
        .returning({ id: exciseDutyClassifications.exciseDutyClassificationId });

      const id = inserted[0].id;
      const classification = await findRow(sql`${exciseDutyClassifications.exciseDutyClassificationId} = ${id}`);
      return { success: true, classification };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const rows = await db.all(
        sql`SELECT * FROM ${exciseDutyClassifications}
            WHERE ${exciseDutyClassifications.companyId} = ${company_id}
              AND ${exciseDutyClassifications.isActive} = 1`
      );
      return { success: true, classifications: rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const classification = await findRow(sql`${exciseDutyClassifications.exciseDutyClassificationId} = ${id}`);
      if (!classification) return { success: false, error: 'Excise Duty Classification not found' };
      return { success: true, classification };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const current = await findRow(sql`${exciseDutyClassifications.exciseDutyClassificationId} = ${data.excise_duty_classification_id}`);
      if (!current) return { success: false, error: 'Excise Duty Classification not found' };

      await db
        .update(exciseDutyClassifications)
        .set({
          name: data.name ?? current.name,
          dutyCode: data.duty_code !== undefined ? data.duty_code : current.duty_code,
          calculationMethod:
            data.calculation_method !== undefined ? data.calculation_method : current.calculation_method,
          updatedAt: sql`datetime('now')`,
        })
        .where(eq(exciseDutyClassifications.exciseDutyClassificationId, data.excise_duty_classification_id));

      const classification = await findRow(sql`${exciseDutyClassifications.exciseDutyClassificationId} = ${data.excise_duty_classification_id}`);
      return { success: true, classification };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const existing = await findRow(sql`${exciseDutyClassifications.exciseDutyClassificationId} = ${id}`);
      if (!existing) return { success: false, error: 'Excise Duty Classification not found' };

      await db.update(exciseDutyClassifications).set({ isActive: 0 }).where(eq(exciseDutyClassifications.exciseDutyClassificationId, id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
