// ---------------------------------------------------------------------------
// Scenario service — Drizzle ORM (follows the budgetService exemplar).
//
//   * MUTATIONS use the query builder (db.insert / db.update).
//   * READS THAT RETURN ROWS use db.all(sql`SELECT * FROM ${table} ...`) so the
//     legacy snake_case shape (scenario_id, voucher_type_id, ...) is preserved
//     for the frontend and audit trail.
//
// A scenario carries two voucher-type sets entered through its Include / Exclude
// lists:
//   includes -> scenario_include_vouchers
//   excludes -> scenario_exclude_vouchers
// create()/update() persist these atomically (update replaces all child rows).
// ---------------------------------------------------------------------------
const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const {
  scenarios,
  scenarioIncludeVouchers,
  scenarioExcludeVouchers,
} = require('../db/schema');

const findRow = async (whereSql) => {
  const rows = await db.all(sql`SELECT * FROM ${scenarios} WHERE ${whereSql}`);
  return rows[0];
};

const loadVouchers = async (scenario_id) => {
  const [includes, excludes] = await Promise.all([
    db.all(sql`SELECT * FROM ${scenarioIncludeVouchers} WHERE ${scenarioIncludeVouchers.scenarioId} = ${scenario_id}`),
    db.all(sql`SELECT * FROM ${scenarioExcludeVouchers} WHERE ${scenarioExcludeVouchers.scenarioId} = ${scenario_id}`),
  ]);
  return { includes, excludes };
};

// Insert the include / exclude voucher sets for a scenario. Rows with no
// voucher type id are skipped.
const insertVouchers = async (scenario_id, data) => {
  const includeRows = (data.includes || [])
    .filter((v) => v && v.voucher_type_id)
    .map((v) => ({
      scenarioId: scenario_id,
      voucherTypeId: Number(v.voucher_type_id),
      vouchersMode: v.vouchers_mode || 'Optional Vouchers Only',
    }));
  if (includeRows.length) await db.insert(scenarioIncludeVouchers).values(includeRows);

  const excludeRows = (data.excludes || [])
    .filter((v) => v && v.voucher_type_id)
    .map((v) => ({
      scenarioId: scenario_id,
      voucherTypeId: Number(v.voucher_type_id),
      vouchersMode: v.vouchers_mode || 'Optional Vouchers Only',
    }));
  if (excludeRows.length) await db.insert(scenarioExcludeVouchers).values(excludeRows);
};

const deleteVouchers = async (scenario_id) => {
  await db.delete(scenarioIncludeVouchers).where(eq(scenarioIncludeVouchers.scenarioId, scenario_id));
  await db.delete(scenarioExcludeVouchers).where(eq(scenarioExcludeVouchers.scenarioId, scenario_id));
};

module.exports = {
  create: async (data) => {
    try {
      const exists = await db.all(
        sql`SELECT * FROM ${scenarios}
            WHERE ${scenarios.companyId} = ${data.company_id}
              AND LOWER(${scenarios.name}) = LOWER(${data.name})
              AND ${scenarios.isActive} = 1`
      );
      if (exists.length > 0) return { success: false, error: 'Scenario already exists' };

      const inserted = await db
        .insert(scenarios)
        .values({
          companyId: data.company_id,
          name: data.name,
          includeActuals: data.include_actuals ? 1 : 0,
          isActive: 1,
          isPredefined: 0,
        })
        .returning({ id: scenarios.scenarioId });

      const scenario_id = inserted[0].id;
      await insertVouchers(scenario_id, data);

      const scenario = await findRow(sql`${scenarios.scenarioId} = ${scenario_id}`);
      const vouchers = await loadVouchers(scenario_id);
      return { success: true, scenario: { ...scenario, ...vouchers } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const rows = await db.all(
        sql`SELECT * FROM ${scenarios}
            WHERE ${scenarios.companyId} = ${company_id}
              AND ${scenarios.isActive} = 1`
      );
      return { success: true, scenarios: rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const scenario = await findRow(sql`${scenarios.scenarioId} = ${id}`);
      if (!scenario) return { success: false, error: 'Scenario not found' };
      const vouchers = await loadVouchers(id);
      return { success: true, scenario: { ...scenario, ...vouchers } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const current = await findRow(sql`${scenarios.scenarioId} = ${data.scenario_id}`);
      if (!current) return { success: false, error: 'Scenario not found' };

      await db
        .update(scenarios)
        .set({
          name: data.name ?? current.name,
          includeActuals:
            data.include_actuals !== undefined ? (data.include_actuals ? 1 : 0) : current.include_actuals,
          updatedAt: sql`datetime('now')`,
        })
        .where(eq(scenarios.scenarioId, data.scenario_id));

      // Replace all child voucher rows with the incoming sets.
      await deleteVouchers(data.scenario_id);
      await insertVouchers(data.scenario_id, data);

      const scenario = await findRow(sql`${scenarios.scenarioId} = ${data.scenario_id}`);
      const vouchers = await loadVouchers(data.scenario_id);
      return { success: true, scenario: { ...scenario, ...vouchers } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const existing = await findRow(sql`${scenarios.scenarioId} = ${id}`);
      if (!existing) return { success: false, error: 'Scenario not found' };

      await db.update(scenarios).set({ isActive: 0 }).where(eq(scenarios.scenarioId, id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
