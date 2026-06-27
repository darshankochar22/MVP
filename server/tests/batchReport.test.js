// Batch report (Inventory Books → Batch, issue #108) integration test.
//
// Mirrors the 44-screenshot flow end-to-end against the real services:
//   1. Create a batch-tracked stock item.
//   2. Purchase voucher allocating two batches (PL-10123 + PL-12345), each with
//      manufacturing + expiry dates (the Stock Item Allocations sub-screen).
//   3. Sales voucher consuming from both batches.
//   4. Assert the three Batch-report queries return what the screens render:
//        batchItems       → item appears in "List of Items"
//        batchesForItem   → "List of Batches" with Name | Mfg Date | Expiry Date
//        batchVouchers    → Inwards / Outwards / running Closing per batch
//
// Focus: executes + correct shape + obvious totals.

const { setupTestDB, createTestCompany, db } = require("./helpers");
const voucherService = require("../voucher/voucherService");
const stockItemService = require("../stockItem/stockItemService");
const stockSummaryReportService = require("../report/stockSummaryReportService");

describe("Batch Report (Inventory Books → Batch)", () => {
  let companyId;
  let fyId;
  let itemId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Batch Report Co");
    companyId = company.company_id;

    const fyResult = await db.execute(
      `SELECT fy_id FROM financial_years WHERE company_id = ? AND is_active = 1`,
      [companyId]
    );
    fyId = fyResult.rows[0].fy_id;

    // 1. Batch-tracked stock item (Maintain in batches + mfg + expiry).
    const itemRes = await stockItemService.create({
      company_id: companyId,
      name: "Paracetamol",
      track_batches: 1,
      track_expiry: 1,
      track_date_of_manufacturing: 1,
    });
    expect(itemRes.success).toBe(true);
    itemId = itemRes.item?.item_id ?? itemRes.itemId ?? itemRes.id;
    expect(itemId).toBeDefined();

    // 2. Purchase — allocate two batches (10 Box each).
    const purchase = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Purchase",
      date: "2026-04-01",
      party_name: "Mohan",
      is_inventory_voucher: 1,
      entries: [],
      stock_entries: [
        {
          stock_item_id: itemId,
          item_name: "Paracetamol",
          quantity: 20,
          rate: 750,
          batches: [
            { batch_number: "PL-10123", mfg_date: "2026-04-01", expiry_date: "2027-05-02", quantity: 10, rate: 750 },
            { batch_number: "PL-12345", mfg_date: "2026-04-01", expiry_date: "2027-06-02", quantity: 10, rate: 750 },
          ],
        },
      ],
    });
    expect(purchase.success).toBe(true);

    // 3. Sales — consume 5 from PL-10123 and 10 from PL-12345.
    const sale = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Sales",
      date: "2026-04-01",
      party_name: "Kamal",
      is_inventory_voucher: 1,
      entries: [],
      stock_entries: [
        {
          stock_item_id: itemId,
          item_name: "Paracetamol",
          quantity: 15,
          rate: 1050,
          batches: [
            { batch_number: "PL-10123", expiry_date: "2027-05-02", quantity: 5, rate: 1050 },
            { batch_number: "PL-12345", expiry_date: "2027-06-02", quantity: 10, rate: 1050 },
          ],
        },
      ],
    });
    expect(sale.success).toBe(true);
  });

  it("batchItems lists the batch-tracked item", async () => {
    const res = await stockSummaryReportService.batchItems(companyId);
    expect(res.success).toBe(true);
    const names = res.items.map((i) => i.name);
    expect(names).toContain("Paracetamol");
  });

  it("batchesForItem returns each batch with mfg + expiry dates", async () => {
    const res = await stockSummaryReportService.batchesForItem(companyId, itemId);
    expect(res.success).toBe(true);
    const byName = Object.fromEntries(res.batches.map((b) => [b.name, b]));
    expect(Object.keys(byName).sort()).toEqual(["PL-10123", "PL-12345"]);
    expect(byName["PL-10123"].mfg_date).toBe("2026-04-01");
    expect(byName["PL-10123"].expiry_date).toBe("2027-05-02");
    expect(byName["PL-12345"].expiry_date).toBe("2027-06-02");
  });

  it("batchVouchers gives inwards/outwards/running closing for PL-10123", async () => {
    const res = await stockSummaryReportService.batchVouchers(
      companyId, fyId, itemId, "PL-10123", "2026-04-01", "2027-03-31"
    );
    expect(res.success).toBe(true);
    expect(res.rows.length).toBe(2);

    const purchase = res.rows.find((r) => r.voucher_type === "Purchase");
    const sale = res.rows.find((r) => r.voucher_type === "Sales");
    expect(purchase.inwards_qty).toBe(10);
    expect(purchase.inwards_value).toBe(7500);
    expect(sale.outwards_qty).toBe(5);
    expect(sale.outwards_value).toBe(5250);   // sale value (5 × 1050)
    // Closing after both vouchers = 10 in − 5 out = 5 Box, valued at cost (5 × 750).
    expect(res.rows[res.rows.length - 1].closing_qty).toBe(5);
    expect(res.rows[res.rows.length - 1].closing_value).toBe(3750);
  });

  it("batchBalances returns on-hand qty per batch (for the allocation popup)", async () => {
    const res = await stockSummaryReportService.batchBalances(companyId, itemId);
    expect(res.success).toBe(true);
    const byName = Object.fromEntries(res.batches.map((b) => [b.name, b]));
    // PL-10123: 10 in − 5 out = 5 ; PL-12345: 10 in − 10 out = 0
    expect(byName["PL-10123"].balance).toBe(5);
    expect(byName["PL-12345"].balance).toBe(0);
    expect(byName["PL-10123"].expiry_date).toBe("2027-05-02");
  });

  it("batchVouchers shows PL-12345 fully consumed (closing 0)", async () => {
    const res = await stockSummaryReportService.batchVouchers(
      companyId, fyId, itemId, "PL-12345", "2026-04-01", "2027-03-31"
    );
    expect(res.success).toBe(true);
    const totalIn = res.rows.reduce((s, r) => s + (r.inwards_qty || 0), 0);
    const totalOut = res.rows.reduce((s, r) => s + (r.outwards_qty || 0), 0);
    expect(totalIn).toBe(10);
    expect(totalOut).toBe(10);
    expect(res.rows[res.rows.length - 1].closing_qty).toBe(0);
  });
});
