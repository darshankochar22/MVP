// Ledger nature is inherited from the parent group (Assets/Liabilities/Income/
// Expenses) — Trial Balance & Balance Sheet classify by it, so it must never be NULL.

const { setupTestDB, createTestCompany, db } = require("./helpers");
const ledgerService = require("../ledger/ledgerService");

describe("ledger nature inheritance", () => {
  let companyId, assetsGroupId, liabGroupId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Ledger Nature Co");
    companyId = company.company_id;
    const grps = await db.execute(`SELECT group_id, name, nature FROM groups WHERE company_id = ?`, [companyId]);
    assetsGroupId = grps.rows.find((g) => g.name === "Current Assets").group_id;
    liabGroupId = grps.rows.find((g) => g.name === "Current Liabilities").group_id;
  });

  it("create inherits nature from the parent group when not supplied", async () => {
    const res = await ledgerService.create({ company_id: companyId, name: "Cash Box", group_id: assetsGroupId });
    expect(res.success).toBe(true);
    expect(res.ledger.nature).toBe("Assets");
  });

  it("an explicitly supplied nature wins over group inheritance", async () => {
    const res = await ledgerService.create({ company_id: companyId, name: "Odd Ledger", group_id: assetsGroupId, nature: "Liabilities" });
    expect(res.success).toBe(true);
    expect(res.ledger.nature).toBe("Liabilities");
  });

  it("update re-inherits nature when the group changes", async () => {
    const created = await ledgerService.create({ company_id: companyId, name: "Mover", group_id: assetsGroupId });
    expect(created.ledger.nature).toBe("Assets");
    const upd = await ledgerService.update({ ledger_id: created.ledger.ledger_id, group_id: liabGroupId });
    expect(upd.success).toBe(true);
    const row = await db.execute(`SELECT nature FROM ledgers WHERE ledger_id = ?`, [created.ledger.ledger_id]);
    expect(row.rows[0].nature).toBe("Liabilities");
  });

  it("update backfills a legacy NULL nature from its group", async () => {
    const created = await ledgerService.create({ company_id: companyId, name: "Legacy", group_id: assetsGroupId });
    await db.execute(`UPDATE ledgers SET nature = NULL WHERE ledger_id = ?`, [created.ledger.ledger_id]);
    const upd = await ledgerService.update({ ledger_id: created.ledger.ledger_id, name: "Legacy Renamed" });
    expect(upd.success).toBe(true);
    const row = await db.execute(`SELECT nature FROM ledgers WHERE ledger_id = ?`, [created.ledger.ledger_id]);
    expect(row.rows[0].nature).toBe("Assets");
  });
});
