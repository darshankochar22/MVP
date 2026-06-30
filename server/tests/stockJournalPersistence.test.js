// Verification test for the Stock Journal voucher (Source/Consumption +
// Destination/Production). Creates one Stock Journal with multiple items on each
// side, reads it back, and confirms:
//   - is_source persisted per line (source = 1, destination = 0)
//   - quantity/rate/amount survive the round-trip
//   - closing stock moves correctly (source consumes, destination produces)

const { setupTestDB, createTestCompany, db } = require("./helpers");
const voucherService = require("../voucher/voucherService");
const stockItemService = require("../stockItem/stockItemService");
const { calculateClosingStock } = require("../report/stockValuationEngine");

describe("Stock Journal persistence + stock movement", () => {
  let companyId, fyId, steelId, plasticId, pipeId, voucherId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Stock Journal Co");
    companyId = company.company_id;

    const fy = await db.execute(
      `SELECT fy_id FROM financial_years WHERE company_id = ? AND is_active = 1`,
      [companyId]
    );
    fyId = fy.rows[0].fy_id;

    // Two raw materials with opening stock to consume, one finished good produced.
    const steel = await stockItemService.create({
      company_id: companyId, name: "Steel", opening_quantity: 100, opening_rate: 50,
    });
    steelId = steel.item?.item_id ?? steel.itemId ?? steel.id;

    const plastic = await stockItemService.create({
      company_id: companyId, name: "Plastic", opening_quantity: 80, opening_rate: 20,
    });
    plasticId = plastic.item?.item_id ?? plastic.itemId ?? plastic.id;

    const pipe = await stockItemService.create({
      company_id: companyId, name: "Pipe",
    });
    pipeId = pipe.item?.item_id ?? pipe.itemId ?? pipe.id;

    // Mirrors exactly what useVoucherForm builds for a Stock Journal submit.
    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Stock Journal",
      date: "2026-04-10",
      is_accounting_voucher: 0,
      is_inventory_voucher: 1,
      entries: [],
      stock_entries: [
        { stock_item_id: steelId, item_name: "Steel", quantity: 20, rate: 50, amount: 1000, is_source: 1 },
        { stock_item_id: plasticId, item_name: "Plastic", quantity: 15, rate: 20, amount: 300, is_source: 1 },
        { stock_item_id: pipeId, item_name: "Pipe", quantity: 10, rate: 130, amount: 1300, is_source: 0 },
      ],
    });
    expect(res.success).toBe(true);
    voucherId = res.voucher.voucher_id;
  });

  it("persists both sides with correct is_source flags", async () => {
    const res = await voucherService.getById(voucherId);
    expect(res.success).toBe(true);
    const lines = res.voucher.stock_entries;
    expect(lines.length).toBe(3);

    const steel = lines.find((l) => l.item_name === "Steel");
    const plastic = lines.find((l) => l.item_name === "Plastic");
    const pipe = lines.find((l) => l.item_name === "Pipe");

    expect(Number(steel.is_source)).toBe(1);
    expect(Number(plastic.is_source)).toBe(1);
    expect(Number(pipe.is_source)).toBe(0);

    expect(Number(steel.quantity)).toBe(20);
    expect(Number(pipe.quantity)).toBe(10);
    expect(Number(pipe.rate)).toBe(130);
  });

  it("moves closing stock: source consumes, destination produces", async () => {
    const val = await calculateClosingStock(companyId, fyId);
    expect(val.success).toBe(true);
    const find = (name) => val.items.find((i) => i.name === name);

    // Steel: 100 opening − 20 consumed = 80
    expect(Number(find("Steel").closing_qty)).toBe(80);
    // Plastic: 80 opening − 15 consumed = 65
    expect(Number(find("Plastic").closing_qty)).toBe(65);
    // Pipe: 0 opening + 10 produced = 10
    expect(Number(find("Pipe").closing_qty)).toBe(10);
  });

  it("persists batch allocations on a Stock Journal destination line", async () => {
    const med = await stockItemService.create({
      company_id: companyId, name: "Paracetamol",
      track_batches: 1, track_expiry: 1, track_date_of_manufacturing: 1,
    });
    const medId = med.item?.item_id ?? med.itemId ?? med.id;

    // Mirrors what the Stock Item Allocations popup writes back into the payload:
    // a destination (produced) line carrying one batch.
    const res = await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Stock Journal",
      date: "2026-04-12", is_accounting_voucher: 0, is_inventory_voucher: 1, entries: [],
      stock_entries: [
        {
          stock_item_id: medId, item_name: "Paracetamol",
          quantity: 7, rate: 30000, amount: 210000, is_source: 0,
          batches: [
            { batch_number: "7889", godown: "Main Location", mfg_date: "2026-03-02", expiry_date: "2026-03-11", quantity: 7, actual_quantity: 7, rate: 30000 },
          ],
        },
      ],
    });
    expect(res.success).toBe(true);

    const back = await voucherService.getById(res.voucher.voucher_id);
    const line = back.voucher.stock_entries[0];
    expect(Number(line.is_source)).toBe(0);
    expect(line.batches.length).toBe(1);
    expect(line.batches[0].batch_number).toBe("7889");
    expect(line.batches[0].godown).toBe("Main Location");
    expect(Number(line.batches[0].quantity)).toBe(7);
  });

  it("getLastPurchaseRate returns null before any purchase, then the most recent rate", async () => {
    const wire = await stockItemService.create({ company_id: companyId, name: "Wire" });
    const wireId = wire.item?.item_id ?? wire.itemId ?? wire.id;

    // No purchase history yet → rate is null (user types the rate manually).
    let res = await stockItemService.getLastPurchaseRate(companyId, wireId);
    expect(res.success).toBe(true);
    expect(res.rate).toBeNull();

    await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Purchase",
      date: "2026-04-05", party_name: "Supplier A", is_invoice: 1, is_inventory_voucher: 1,
      entries: [], stock_entries: [{ stock_item_id: wireId, item_name: "Wire", quantity: 10, rate: 45 }],
    });
    res = await stockItemService.getLastPurchaseRate(companyId, wireId);
    expect(Number(res.rate)).toBe(45);

    // A later purchase at a different rate becomes the autofill source.
    await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Purchase",
      date: "2026-04-18", party_name: "Supplier B", is_invoice: 1, is_inventory_voucher: 1,
      entries: [], stock_entries: [{ stock_item_id: wireId, item_name: "Wire", quantity: 4, rate: 52 }],
    });
    res = await stockItemService.getLastPurchaseRate(companyId, wireId);
    expect(Number(res.rate)).toBe(52);
  });
});
