// Persistence integration test for the Credit Note sub-screens added recently:
//   - Stock Item Allocations (batch + godown + actual qty + disc %)
//   - Per-item Excise Details ("Excise Details for <item>")
//   - GST note Additional Details (Reason / Supplier's D-C Note No / Date)
// Creates one Credit Note carrying all of them, reads it back, asserts each
// field survived the round-trip through the DB.

const { setupTestDB, createTestCompany, db } = require("./helpers");
const voucherService = require("../voucher/voucherService");
const stockItemService = require("../stockItem/stockItemService");

describe("Credit Note sub-screen persistence", () => {
  let companyId, fyId, itemId, voucherId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("CN Persistence Co");
    companyId = company.company_id;

    const fy = await db.execute(
      `SELECT fy_id FROM financial_years WHERE company_id = ? AND is_active = 1`,
      [companyId]
    );
    fyId = fy.rows[0].fy_id;

    const itemRes = await stockItemService.create({
      company_id: companyId,
      name: "Mouse",
      track_batches: 1,
      track_expiry: 1,
      track_date_of_manufacturing: 1,
      excise_applicable: "Applicable",
    });
    itemId = itemRes.item?.item_id ?? itemRes.itemId ?? itemRes.id;

    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Credit Note",
      date: "2026-04-01",
      party_name: "ABC Customer",
      is_invoice: 1,
      is_inventory_voucher: 1,
      entries: [],
      stock_entries: [
        {
          stock_item_id: itemId,
          item_name: "Mouse",
          quantity: 5,
          rate: 1600,
          batches: [
            {
              batch_number: "12121",
              godown: "Burari",
              mfg_date: "2026-04-01",
              expiry_date: "2027-04-01",
              quantity: 5,
              actual_quantity: 5,
              rate: 1600,
              disc_percent: 10,
            },
          ],
          excise_item_details: {
            sales_invoice_number: "SI-99",
            sales_invoice_date: "2026-03-15",
            excise_sales_invoice: "ESI-1",
            rate_of_duty: "12",
            rate_per_unit: "5",
            supplier_duty_amount: "100",
            mfgr_importer_duty_amount: "50",
          },
        },
      ],
      credit_note_details: {
        reason_for_issuing_note: "04-Correction in Invoice",
        supplier_note_no: "SN-7",
        supplier_note_date: "2026-03-20",
        nature_of_return: "Other Adjustments",
      },
      excise_details: {
        inspection_document_no: "INSP-42",
        inspection_document_date: "2026-03-18",
      },
    });
    expect(res.success).toBe(true);
    voucherId = res.voucher.voucher_id;
  });

  it("persists voucher-level excise details (inspection doc) through create + update", async () => {
    const res = await voucherService.getById(voucherId);
    expect(res.success).toBe(true);
    expect(res.voucher.excise_details).toBeTruthy();
    expect(res.voucher.excise_details.inspection_document_no).toBe("INSP-42");
    expect(res.voucher.excise_details.inspection_document_date).toBe("2026-03-18");

    // Alter path: update must replace, not drop, the excise details.
    const upd = await voucherService.update({
      voucher_id: voucherId,
      company_id: companyId,
      excise_details: {
        inspection_document_no: "INSP-43",
        inspection_document_date: "2026-03-19",
      },
    });
    expect(upd.success).toBe(true);
    const back = await voucherService.getById(voucherId);
    expect(back.voucher.excise_details.inspection_document_no).toBe("INSP-43");
  });

  it("persists batch allocation incl. godown, actual qty and disc %", async () => {
    const res = await voucherService.getById(voucherId);
    expect(res.success).toBe(true);
    const batch = res.voucher.stock_entries[0].batches[0];
    expect(batch.batch_number).toBe("12121");
    expect(batch.godown).toBe("Burari");
    expect(Number(batch.actual_quantity)).toBe(5);
    expect(Number(batch.disc_percent)).toBe(10);
  });

  it("persists a godown-only allocation (empty batch number)", async () => {
    const itemRes = await stockItemService.create({
      company_id: companyId,
      name: "Onion",
    });
    const onionId = itemRes.item?.item_id ?? itemRes.itemId ?? itemRes.id;
    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Credit Note",
      date: "2026-04-02",
      party_name: "ABC Customer",
      is_invoice: 1,
      is_inventory_voucher: 1,
      entries: [],
      stock_entries: [
        {
          stock_item_id: onionId,
          item_name: "Onion",
          quantity: 12,
          rate: 180,
          batches: [{ batch_number: "", godown: "Main Location", quantity: 12, actual_quantity: 12, rate: 180 }],
        },
      ],
    });
    expect(res.success).toBe(true);
    const back = await voucherService.getById(res.voucher.voucher_id);
    const batch = back.voucher.stock_entries[0].batches[0];
    expect(batch.godown).toBe("Main Location");
    expect(Number(batch.quantity)).toBe(12);
  });

  it("persists per-item excise details", async () => {
    const res = await voucherService.getById(voucherId);
    const ex = res.voucher.stock_entries[0].excise_item_details;
    expect(ex).toBeTruthy();
    expect(ex.sales_invoice_number).toBe("SI-99");
    expect(ex.rate_of_duty).toBe("12");
    expect(ex.mfgr_importer_duty_amount).toBe("50");
  });

  it("persists GST note additional details (reason / supplier note / date)", async () => {
    const res = await voucherService.getById(voucherId);
    const cn = res.voucher.credit_note_details;
    expect(cn).toBeTruthy();
    expect(cn.reason_for_issuing_note).toBe("04-Correction in Invoice");
    expect(cn.supplier_note_no).toBe("SN-7");
    expect(cn.supplier_note_date).toBe("2026-03-20");
    expect(cn.nature_of_return).toBe("Other Adjustments");
  });

  it("persists Sales VAT details (date_time + point_of_sale)", async () => {
    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Sales",
      date: "2026-04-03",
      party_name: "Aman Electronics",
      is_invoice: 1,
      is_inventory_voucher: 1,
      entries: [],
      stock_entries: [{ stock_item_id: itemId, item_name: "Mouse", quantity: 1, rate: 900 }],
      vat_details: { date_time: "2026-03-02T06:45", point_of_sale: "Chhattisgarh" },
    });
    expect(res.success).toBe(true);
    const back = await voucherService.getById(res.voucher.voucher_id);
    expect(back.voucher.vat_details).toBeTruthy();
    expect(back.voucher.vat_details.date_time).toBe("2026-03-02T06:45");
    expect(back.voucher.vat_details.point_of_sale).toBe("Chhattisgarh");
  });

  it("persists Debit Note excise (date & time of invoice / removal)", async () => {
    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Debit Note",
      date: "2026-04-04",
      party_name: "XYZ Suppliers",
      is_invoice: 1,
      is_inventory_voucher: 1,
      entries: [],
      stock_entries: [{ stock_item_id: itemId, item_name: "Mouse", quantity: 1, rate: 900 }],
      debit_note_details: {
        date_time_of_invoice: "2026-03-02T14:37",
        date_time_of_removal: "2026-03-02T14:37",
        reason_for_issuing_note: "04-Correction in Invoice",
        supplier_note_no: "DN-9",
        supplier_note_date: "2026-03-21",
        nature_of_return: "Other Adjustments",
      },
    });
    expect(res.success).toBe(true);
    const back = await voucherService.getById(res.voucher.voucher_id);
    const dn = back.voucher.debit_note_details;
    expect(dn).toBeTruthy();
    expect(dn.date_time_of_invoice).toBe("2026-03-02T14:37");
    expect(dn.date_time_of_removal).toBe("2026-03-02T14:37");
    expect(dn.reason_for_issuing_note).toBe("04-Correction in Invoice");
    expect(dn.supplier_note_no).toBe("DN-9");
    expect(dn.supplier_note_date).toBe("2026-03-21");
    expect(dn.nature_of_return).toBe("Other Adjustments");
  });

  it("persists Material In order details (order + party document details)", async () => {
    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Material In",
      date: "2026-04-05",
      party_name: "XYZ Suppliers",
      is_inventory_voucher: 1,
      entries: [],
      stock_entries: [{ stock_item_id: itemId, item_name: "Mouse", quantity: 2, rate: 500 }],
      order_details: {
        order_nos: "ORD-1",
        order_date: "2026-03-01",
        source_godown_id: 1,
        source_godown_name: "Main Location",
        mode_terms_of_payment: "Net 30",
        challan_nos: "CH-5",
        carrier_name: "BlueDart",
        motor_vehicle_no: "CG-04-AB-1234",
      },
    });
    expect(res.success).toBe(true);
    const back = await voucherService.getById(res.voucher.voucher_id);
    const od = back.voucher.order_details;
    expect(od).toBeTruthy();
    expect(od.order_nos).toBe("ORD-1");
    expect(od.source_godown_name).toBe("Main Location");
    expect(od.mode_terms_of_payment).toBe("Net 30");
    expect(od.challan_nos).toBe("CH-5");
    expect(od.carrier_name).toBe("BlueDart");
    expect(od.motor_vehicle_no).toBe("CG-04-AB-1234");
  });

  it("persists Material In stock allocations (order no / due on / godown)", async () => {
    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Material In",
      date: "2026-04-06",
      party_name: "XYZ Suppliers",
      is_inventory_voucher: 1,
      entries: [],
      stock_entries: [
        {
          stock_item_id: itemId,
          item_name: "Mouse",
          quantity: 5,
          rate: 100,
          batches: [
            {
              batch_number: "",
              godown: "Main Location",
              order_no: "7888",
              due_on: "9 Months",
              component_of: "Not Applicable",
              consider_as_scrap: "Yes",
              quantity: 5,
              rate: 100,
            },
          ],
        },
      ],
    });
    expect(res.success).toBe(true);
    const back = await voucherService.getById(res.voucher.voucher_id);
    const batches = back.voucher.stock_entries[0].batches;
    expect(batches.length).toBe(1);
    expect(batches[0].order_no).toBe("7888");
    expect(batches[0].due_on).toBe("9 Months");
    expect(batches[0].godown).toBe("Main Location");
    expect(batches[0].consider_as_scrap).toBe("Yes");
  });

  it("Material In persists stock line + order-tracked batch allocation + order details together", async () => {
    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Material In",
      date: "2026-04-07",
      party_name: "XYZ Suppliers",
      is_inventory_voucher: 1,
      entries: [],
      stock_entries: [
        {
          stock_item_id: itemId,
          item_name: "Paracetamol",
          quantity: 9,
          rate: 750,
          batches: [
            {
              batch_number: "PL679",
              godown: "Main Location",
              order_no: "679",
              due_on: "7 Months",
              component_of: "Not Applicable",
              consider_as_scrap: "No",
              mfg_date: "2026-03-02",
              expiry_date: "6 Months",
              quantity: 9,
              rate: 750,
            },
          ],
        },
      ],
      order_details: { order_nos: "ORD-9", source_godown_id: 1, source_godown_name: "Main Location" },
    });
    expect(res.success).toBe(true);
    const back = await voucherService.getById(res.voucher.voucher_id);
    const se = back.voucher.stock_entries[0];
    expect(Number(se.quantity)).toBe(9);
    expect(Number(se.rate)).toBe(750);
    const b = se.batches[0];
    expect(b.batch_number).toBe("PL679");
    expect(b.order_no).toBe("679");
    expect(b.component_of).toBe("Not Applicable");
    expect(b.godown).toBe("Main Location");
    expect(b.mfg_date).toBe("2026-03-02");
    expect(b.expiry_date).toBe("6 Months");
    expect(back.voucher.order_details.order_nos).toBe("ORD-9");
    expect(back.voucher.order_details.source_godown_name).toBe("Main Location");
  });

  it("Material Out persists order details + godown allocation", async () => {
    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Material Out",
      date: "2026-04-08",
      party_name: "ABC Electronics",
      is_inventory_voucher: 1,
      entries: [],
      stock_entries: [
        {
          stock_item_id: itemId,
          item_name: "Paracetamol",
          quantity: 5,
          rate: 200,
          batches: [{ batch_number: "", godown: "Main Location", order_no: "765", due_on: "9 Days", quantity: 5, rate: 200 }],
        },
      ],
      order_details: { order_nos: "MO-1", source_godown_name: "Main Location" },
    });
    expect(res.success).toBe(true);
    const back = await voucherService.getById(res.voucher.voucher_id);
    expect(back.voucher.order_details.order_nos).toBe("MO-1");
    expect(back.voucher.order_details.source_godown_name).toBe("Main Location");
    expect(back.voucher.stock_entries[0].batches[0].godown).toBe("Main Location");
    expect(back.voucher.stock_entries[0].batches[0].order_no).toBe("765");
  });

  it("Daybook shows stock item name + quantity for Material In / Material Out", async () => {
    const inRes = await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Material In",
      date: "2026-04-20", party_name: "XYZ Suppliers", is_inventory_voucher: 1,
      entries: [], stock_entries: [{ stock_item_id: itemId, item_name: "Fan", quantity: 12, rate: 1000 }],
    });
    const outRes = await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Material Out",
      date: "2026-04-21", party_name: "ABC Electronics", is_inventory_voucher: 1,
      entries: [], stock_entries: [{ stock_item_id: itemId, item_name: "Fan", quantity: 15, rate: 1000 }],
    });
    expect(inRes.success).toBe(true);
    expect(outRes.success).toBe(true);

    const dayb = await voucherService.getDaybook(companyId, fyId, "2026-04-01", "2026-04-30");
    expect(dayb.success).toBe(true);
    const inRow = dayb.vouchers.find((r) => r.voucher_id === inRes.voucher.voucher_id);
    const outRow = dayb.vouchers.find((r) => r.voucher_id === outRes.voucher.voucher_id);

    // Material In → item name as particulars, quantity on the Debit (inwards) side.
    expect(inRow.stock_item_name).toBe("Fan");
    expect(Number(inRow.inwards_qty)).toBe(12);
    expect(Number(inRow.outwards_qty)).toBe(0);

    // Material Out → item name as particulars, quantity on the Credit (outwards) side.
    expect(outRow.stock_item_name).toBe("Fan");
    expect(Number(outRow.outwards_qty)).toBe(15);
    expect(Number(outRow.inwards_qty)).toBe(0);
  });
});
