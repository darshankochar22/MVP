const { setupTestDB, createTestCompany } = require("./helpers");
const budgetService = require("../budget/budgetService");
const groupService = require("../group/groupService");
const ledgerService = require("../ledger/ledgerService");
const costCentreService = require("../costCentre/costCentreService");

describe("Budget Service Tests", () => {
  let companyId;
  let groupId;
  let ledgerId;
  let ccId;
  let budgetId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Budget Test Co");
    companyId = company.company_id;

    const grp = await groupService.create({ company_id: companyId, name: "Budget Grp", nature: "Expenses" });
    groupId = grp.group.group_id;
    const led = await ledgerService.create({ company_id: companyId, name: "Budget Ledger", group_id: groupId });
    ledgerId = led.ledger.ledger_id;
    const cc = await costCentreService.create({ company_id: companyId, name: "Budget CC" });
    ccId = cc.costCentre.cc_id;
  });

  it("creates a budget with group / ledger / cost-centre allocations", async () => {
    const res = await budgetService.create({
      company_id: companyId,
      name: "FY26 Budget",
      period_from: "2-Apr-26",
      period_to: "2-May-26",
      groups: [{ group_id: groupId, cost_centre_id: ccId, type_of_budget: "On Closing Balance", amount: 20000 }],
      ledgers: [{ ledger_id: ledgerId, cost_centre_id: null, type_of_budget: "On Nett Transactions", amount: 5000 }],
      costCentres: [{ cost_centre_id: ccId, expenses: 1000, income: 20000, closing_balance: 20000 }],
    });
    expect(res.success).toBe(true);
    expect(res.budget.budget_id).toBeDefined();
    expect(res.budget.groups.length).toBe(1);
    expect(res.budget.ledgers.length).toBe(1);
    expect(res.budget.costCentres.length).toBe(1);
    expect(res.budget.groups[0].amount).toBe(20000);
    expect(res.budget.ledgers[0].type_of_budget).toBe("On Nett Transactions");
    expect(res.budget.costCentres[0].income).toBe(20000);
    budgetId = res.budget.budget_id;
  });

  it("rejects duplicate budget name", async () => {
    const res = await budgetService.create({ company_id: companyId, name: "FY26 Budget" });
    expect(res.success).toBe(false);
  });

  it("reads a budget back with its allocations", async () => {
    const res = await budgetService.getById(budgetId);
    expect(res.success).toBe(true);
    expect(res.budget.name).toBe("FY26 Budget");
    expect(res.budget.period_from).toBe("2-Apr-26");
    expect(res.budget.groups[0].group_id).toBe(groupId);
  });

  it("lists active budgets", async () => {
    const res = await budgetService.getAll(companyId);
    expect(res.success).toBe(true);
    expect(res.budgets.some((b) => b.budget_id === budgetId)).toBe(true);
  });

  it("update replaces allocations", async () => {
    const res = await budgetService.update({
      budget_id: budgetId,
      name: "FY26 Budget Revised",
      groups: [{ group_id: groupId, cost_centre_id: null, type_of_budget: "On Closing Balance", amount: 30000 }],
      ledgers: [],
      costCentres: [],
    });
    expect(res.success).toBe(true);
    expect(res.budget.name).toBe("FY26 Budget Revised");
    expect(res.budget.groups.length).toBe(1);
    expect(res.budget.groups[0].amount).toBe(30000);
    expect(res.budget.ledgers.length).toBe(0);
    expect(res.budget.costCentres.length).toBe(0);
  });

  it("soft-deletes a budget", async () => {
    const del = await budgetService.delete(budgetId);
    expect(del.success).toBe(true);
    const after = await budgetService.getAll(companyId);
    expect(after.budgets.some((b) => b.budget_id === budgetId)).toBe(false);
  });
});
