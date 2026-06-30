// Verification test for the Purchase Order voucher (order entry — non-accounting,
// inventory-tracking). Mirrors exactly what useVoucherForm builds on submit:
// party + Order Details + Party Details + stock items (one non-batch godown
// allocation, one batch/lot allocation). Reads it back and confirms every piece
// survives the round-trip and the voucher is flagged order (not accounting).

const { setupTestDB, createTestCompany, db } = require("./helpers");
const voucherService = require("../voucher/voucherService");
const stockItemService = require("../stockItem/stockItemService");

describe("Purchase Order persistence", () => {
  let companyId, fyId, iceId, medId, voucherId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Purchase Order Co");
    companyId = company.company_id;

    const fy = await db.execute(
      `SELECT fy_id FROM financial_years WHERE company_id = ? AND is_active = 1`,
      [companyId]
    );
    fyId = fy.rows[0].fy_id;

    // Non-batch item (godown-only allocation) + batch-tracked item (batch/lot).
    const ice = await stockItemService.create({
      company_id: companyId, name: "Chocolate Icecream",
    });
    iceId = ice.item?.item_id ?? ice.itemId ?? ice.id;

    const med = await stockItemService.create({
      company_id: companyId, name: "Paracetamol",
      track_batches: 1, track_expiry: 1, track_date_of_manufacturing: 1,
    });
    medId = med.item?.item_id ?? med.itemId ?? med.id;

    // Mirrors useVoucherForm's order-voucher submit payload: no Dr/Cr entries,
    // order_details + party_details from the popups, and per-line allocations
    // (godown for the non-batch item, batch/lot for the tracked item).
    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Purchase Order",
      date: "2026-04-01",
      party_name: "SuppliersB",
      is_accounting_voucher: 0,
      is_inventory_voucher: 1,
      is_order_voucher: 1,
      entries: [],
      order_details: {
        order_nos: "1",
        order_date: "2026-04-01",
        mode_terms_of_payment: "30 Days Credit",
        other_references: "REF-77",
        terms_of_delivery: "FOB",
        dispatched_through: "Road",
        destination: "Itanagar",
        motor_vehicle_no: "AP01AB1234",
      },
      party_details: {
        supplier_name: "SuppliersB",
        mailing_name: "SuppliersB",
        address: "Main Road",
        state: "Arunachal Pradesh",
        country: "India",
      },
      stock_entries: [
        // Non-batch item → godown-only allocation (Chocolate Icecream, 2 nos @ 100).
        {
          stock_item_id: iceId, item_name: "Chocolate Icecream",
          quantity: 2, rate: 100, amount: 200,
          batches: [
            { godown: "Main Location", quantity: 2, actual_quantity: 2, rate: 100 },
          ],
        },
        // Batch-tracked item → batch/lot allocation (Paracetamol, 7 Box @ 750).
        {
          stock_item_id: medId, item_name: "Paracetamol",
          quantity: 7, rate: 750, amount: 5250,
          batches: [
            { batch_number: "7889", godown: "Any", mfg_date: "2026-03-02", expiry_date: "2027-03-02", quantity: 7, actual_quantity: 7, rate: 750 },
          ],
        },
      ],
    });
    expect(res.success).toBe(true);
    voucherId = res.voucher.voucher_id;
  });

  it("persists the voucher as a non-accounting order voucher", async () => {
    const res = await voucherService.getById(voucherId);
    expect(res.success).toBe(true);
    expect(res.voucher.voucher_type).toBe("Purchase Order");
    expect(Number(res.voucher.is_accounting_voucher)).toBe(0);
    expect(Number(res.voucher.is_order_voucher)).toBe(1);
    // Order vouchers post no Dr/Cr entries.
    expect(res.voucher.entries.length).toBe(0);
  });

  it("persists Order Details (Mode/Terms, Terms of Delivery, dispatch) from the popup", async () => {
    const od = (await voucherService.getById(voucherId)).voucher.order_details;
    expect(od).toBeTruthy();
    expect(od.order_nos).toBe("1");
    expect(od.mode_terms_of_payment).toBe("30 Days Credit");
    expect(od.terms_of_delivery).toBe("FOB");
    expect(od.destination).toBe("Itanagar");
    expect(od.motor_vehicle_no).toBe("AP01AB1234");
  });

  it("persists Party Details (Supplier, State, Country) from the popup", async () => {
    const pd = (await voucherService.getById(voucherId)).voucher.party_details;
    expect(pd).toBeTruthy();
    expect(pd.supplier_name).toBe("SuppliersB");
    expect(pd.state).toBe("Arunachal Pradesh");
    expect(pd.country).toBe("India");
  });

  it("persists item allocations for non-batch (godown) and batch (lot) items", async () => {
    const lines = (await voucherService.getById(voucherId)).voucher.stock_entries;
    expect(lines.length).toBe(2);

    const ice = lines.find((l) => l.item_name === "Chocolate Icecream");
    expect(ice.batches.length).toBe(1);
    expect(ice.batches[0].godown).toBe("Main Location");
    expect(ice.batches[0].batch_number).toBeFalsy(); // non-batch: godown only, no lot
    expect(Number(ice.batches[0].quantity)).toBe(2);

    const med = lines.find((l) => l.item_name === "Paracetamol");
    expect(med.batches.length).toBe(1);
    expect(med.batches[0].batch_number).toBe("7889");
    expect(med.batches[0].expiry_date).toBe("2027-03-02");
    expect(Number(med.batches[0].quantity)).toBe(7);
  });
});
