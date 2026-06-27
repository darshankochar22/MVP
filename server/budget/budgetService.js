// ---------------------------------------------------------------------------
// Budget service — Drizzle ORM (follows the costCentreService exemplar).
//
//   * MUTATIONS use the query builder (db.insert / db.update).
//   * READS THAT RETURN ROWS use db.all(sql`SELECT * FROM ${table} ...`) so the
//     legacy snake_case shape (budget_id, parent_id, cost_centre_id, ...) is
//     preserved for the frontend and audit trail.
//
// A budget carries three allocation arrays entered through its sub-screens:
//   groups       -> budget_group_allocations
//   ledgers      -> budget_ledger_allocations
//   costCentres  -> budget_cost_centre_allocations
// create()/update() persist these atomically (update replaces all child rows).
// ---------------------------------------------------------------------------
const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const {
  budgets,
  budgetGroupAllocations,
  budgetLedgerAllocations,
  budgetCostCentreAllocations,
} = require('../db/schema');

const findRow = async (whereSql) => {
  const rows = await db.all(sql`SELECT * FROM ${budgets} WHERE ${whereSql}`);
  return rows[0];
};

const loadAllocations = async (budget_id) => {
  const [groups, ledgers, costCentres] = await Promise.all([
    db.all(sql`SELECT * FROM ${budgetGroupAllocations} WHERE ${budgetGroupAllocations.budgetId} = ${budget_id}`),
    db.all(sql`SELECT * FROM ${budgetLedgerAllocations} WHERE ${budgetLedgerAllocations.budgetId} = ${budget_id}`),
    db.all(sql`SELECT * FROM ${budgetCostCentreAllocations} WHERE ${budgetCostCentreAllocations.budgetId} = ${budget_id}`),
  ]);
  return { groups, ledgers, costCentres };
};

// Insert the three allocation sets for a budget. Rows with no target id are skipped.
const insertAllocations = async (budget_id, data) => {
  const groupRows = (data.groups || [])
    .filter((g) => g && g.group_id)
    .map((g) => ({
      budgetId: budget_id,
      groupId: Number(g.group_id),
      costCentreId: g.cost_centre_id ? Number(g.cost_centre_id) : null,
      typeOfBudget: g.type_of_budget || 'On Closing Balance',
      amount: Number(g.amount) || 0,
    }));
  if (groupRows.length) await db.insert(budgetGroupAllocations).values(groupRows);

  const ledgerRows = (data.ledgers || [])
    .filter((l) => l && l.ledger_id)
    .map((l) => ({
      budgetId: budget_id,
      ledgerId: Number(l.ledger_id),
      costCentreId: l.cost_centre_id ? Number(l.cost_centre_id) : null,
      typeOfBudget: l.type_of_budget || 'On Closing Balance',
      amount: Number(l.amount) || 0,
    }));
  if (ledgerRows.length) await db.insert(budgetLedgerAllocations).values(ledgerRows);

  const ccRows = (data.costCentres || [])
    .filter((c) => c && c.cost_centre_id)
    .map((c) => ({
      budgetId: budget_id,
      costCentreId: Number(c.cost_centre_id),
      expenses: Number(c.expenses) || 0,
      income: Number(c.income) || 0,
      closingBalance: Number(c.closing_balance) || 0,
    }));
  if (ccRows.length) await db.insert(budgetCostCentreAllocations).values(ccRows);
};

const deleteAllocations = async (budget_id) => {
  await db.delete(budgetGroupAllocations).where(eq(budgetGroupAllocations.budgetId, budget_id));
  await db.delete(budgetLedgerAllocations).where(eq(budgetLedgerAllocations.budgetId, budget_id));
  await db.delete(budgetCostCentreAllocations).where(eq(budgetCostCentreAllocations.budgetId, budget_id));
};

module.exports = {
  create: async (data) => {
    try {
      const exists = await db.all(
        sql`SELECT * FROM ${budgets}
            WHERE ${budgets.companyId} = ${data.company_id}
              AND LOWER(${budgets.name}) = LOWER(${data.name})
              AND ${budgets.isActive} = 1`
      );
      if (exists.length > 0) return { success: false, error: 'Budget already exists' };

      const inserted = await db
        .insert(budgets)
        .values({
          companyId: data.company_id,
          name: data.name,
          parentId: data.parent_id || null,
          periodFrom: data.period_from || null,
          periodTo: data.period_to || null,
          isActive: 1,
          isPredefined: 0,
        })
        .returning({ id: budgets.budgetId });

      const budget_id = inserted[0].id;
      await insertAllocations(budget_id, data);

      const budget = await findRow(sql`${budgets.budgetId} = ${budget_id}`);
      const allocations = await loadAllocations(budget_id);
      return { success: true, budget: { ...budget, ...allocations } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getAll: async (company_id) => {
    try {
      const rows = await db.all(
        sql`SELECT * FROM ${budgets}
            WHERE ${budgets.companyId} = ${company_id}
              AND ${budgets.isActive} = 1`
      );
      return { success: true, budgets: rows };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getById: async (id) => {
    try {
      const budget = await findRow(sql`${budgets.budgetId} = ${id}`);
      if (!budget) return { success: false, error: 'Budget not found' };
      const allocations = await loadAllocations(id);
      return { success: true, budget: { ...budget, ...allocations } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  update: async (data) => {
    try {
      const current = await findRow(sql`${budgets.budgetId} = ${data.budget_id}`);
      if (!current) return { success: false, error: 'Budget not found' };

      await db
        .update(budgets)
        .set({
          name: data.name ?? current.name,
          parentId: data.parent_id !== undefined ? (data.parent_id || null) : current.parent_id,
          periodFrom: data.period_from !== undefined ? (data.period_from || null) : current.period_from,
          periodTo: data.period_to !== undefined ? (data.period_to || null) : current.period_to,
          updatedAt: sql`datetime('now')`,
        })
        .where(eq(budgets.budgetId, data.budget_id));

      // Replace all child allocation rows with the incoming sets.
      await deleteAllocations(data.budget_id);
      await insertAllocations(data.budget_id, data);

      const budget = await findRow(sql`${budgets.budgetId} = ${data.budget_id}`);
      const allocations = await loadAllocations(data.budget_id);
      return { success: true, budget: { ...budget, ...allocations } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  delete: async (id) => {
    try {
      const existing = await findRow(sql`${budgets.budgetId} = ${id}`);
      if (!existing) return { success: false, error: 'Budget not found' };

      const hasChildren = await db.all(
        sql`SELECT * FROM ${budgets}
            WHERE ${budgets.parentId} = ${id}
              AND ${budgets.isActive} = 1`
      );
      if (hasChildren.length > 0) return { success: false, error: 'Cannot delete Budget with sub-budgets' };

      await db.update(budgets).set({ isActive: 0 }).where(eq(budgets.budgetId, id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
