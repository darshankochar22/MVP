// Verification test for inventory allocations carried on a Journal / Reversing
// Journal ledger row (Purchase/Sales A/c → Inventory Allocations → Item Allocations
// → Cost Centre). Mirrors exactly the payload useVoucherForm now builds and confirms
// the backend persists, for a non-Sales/Purchase voucher:
//   - stock_entries (with their godown/batch split) attach to the voucher
//   - per-entry cost_centres attach to the inventory-affecting ledger entry
//   - everything round-trips through getById

const { setupTestDB, createTestCompany, db } = require("./helpers");
const voucherService = require("../voucher/voucherService");
const stockItemService = require("../stockItem/stockItemService");
const costCentreService = require("../costCentre/costCentreService");

describe("Journal / Reversing Journal inventory + cost-centre allocation", () => {
  let companyId, fyId, partyLedgerId, purchaseLedgerId, fanId, ccId, voucherId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Journal Inventory Co");
    companyId = company.company_id;

    const fy = await db.execute(
      `SELECT fy_id FROM financial_years WHERE company_id = ? AND is_active = 1`,
      [companyId]
    );
    fyId = fy.rows[0].fy_id;

    const ledgersResult = await db.execute(
      `SELECT ledger_id, name FROM ledgers WHERE company_id = ?`,
      [companyId]
    );
    // Backend does not restrict ledger groups on persistence, so seeded ledgers suffice.
    partyLedgerId = ledgersResult.rows.find((l) => l.name === "Cash").ledger_id;
    purchaseLedgerId = ledgersResult.rows.find((l) => l.name === "Profit & Loss A/c").ledger_id;

    const fan = await stockItemService.create({ company_id: companyId, name: "Fan" });
    fanId = fan.item?.item_id ?? fan.itemId ?? fan.id;

    const cc = await costCentreService.create({ company_id: companyId, name: "Mo" });
    ccId = cc.costCentre?.cc_id ?? cc.costCentre?.ccId;

    // Exactly what useVoucherForm builds when a Purchase A/c line carries a Fan
    // (3 Pc @ 1,000) with its full 3,000 allocated to cost centre "Mo".
    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Reversing Journal",
      date: "2027-03-02",
      is_accounting_voucher: 1,
      is_optional: 1,
      is_inventory_voucher: 1,
      applicable_upto: "2027-03-02",
      entries: [
        { ledger_id: partyLedgerId, ledger_name: "Aman Electronics", type: "Dr", amount: 3000 },
        {
          ledger_id: purchaseLedgerId, ledger_name: "Purchase A/c", type: "Cr", amount: 3000,
          cost_centres: [{ cost_centre_id: ccId, amount: 3000 }],
        },
      ],
      stock_entries: [
        {
          stock_item_id: fanId, item_name: "Fan", godown_id: null, unit_id: null,
          quantity: 3, rate: 1000, amount: 3000,
          batches: [{ godown: "Main Location", quantity: 3, actual_quantity: 3, rate: 1000 }],
        },
      ],
    });
    expect(res.success).toBe(true);
    voucherId = res.voucher.voucher_id;
  });

  it("persists the stock line with its godown/batch split", async () => {
    const res = await voucherService.getById(voucherId);
    expect(res.success).toBe(true);
    expect(res.voucher.stock_entries.length).toBe(1);
    const line = res.voucher.stock_entries[0];
    expect(line.item_name).toBe("Fan");
    expect(Number(line.quantity)).toBe(3);
    expect(Number(line.rate)).toBe(1000);
    expect(line.batches.length).toBe(1);
    expect(line.batches[0].godown).toBe("Main Location");
    expect(Number(line.batches[0].quantity)).toBe(3);
  });

  it("persists the cost-centre split against the inventory ledger entry", async () => {
    const res = await voucherService.getById(voucherId);
    const ccs = res.voucher.cost_centres;
    expect(ccs.length).toBe(1);
    expect(Number(ccs[0].cost_centre_id)).toBe(Number(ccId));
    expect(Number(ccs[0].amount)).toBe(3000);

    // The cost centre is keyed to the Purchase A/c (Cr) entry, not the party.
    const crEntry = res.voucher.entries.find((e) => e.type === "Cr");
    expect(Number(ccs[0].entry_id)).toBe(Number(crEntry.entry_id));
  });
});
