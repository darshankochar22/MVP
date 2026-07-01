// Bills Receivable/Payable drill-down: outstandingReportService.billVouchers() lists the
// vouchers (original bill + any Agst Ref settlements) that make up one bill row, before
// the frontend opens a specific voucher — mirrors parityReports.test.js's fixture style.

const { setupTestDB, createTestCompany, db } = require("./helpers");
const { sql } = require("drizzle-orm");
const voucherService = require("../voucher/voucherService");
const ledgerService = require("../ledger/ledgerService");
const stockItemService = require("../stockItem/stockItemService");
const unitService = require("../unit/unitService");
const outstandingReportService = require("../report/outstandingReportService");

describe("outstandingReportService.billVouchers", () => {
  let companyId, fyId, debtorLedgerId, cashLedgerId, salesLedgerId, itemId, unitId;
  const BILL_NAME = "INV-BV-001";
  const STOCK_BILL_NAME = "INV-BV-STK-001";
  const SALE_AMOUNT = 50000;
  const SETTLEMENT_AMOUNT = 20000;
  const STOCK_QTY = 10;
  const STOCK_RATE = 1410;

  const fetchGroupId = async (groupName) => {
    const rows = await db.all(
      sql`SELECT group_id FROM groups WHERE company_id = ${companyId} AND name = ${groupName} LIMIT 1`
    );
    return rows[0].group_id;
  };

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Bill Vouchers Co");
    companyId = company.company_id;

    const fyResult = await db.execute(
      `SELECT fy_id FROM financial_years WHERE company_id = ? AND is_active = 1`,
      [companyId]
    );
    fyId = fyResult.rows[0].fy_id;

    const cashRows = await db.all(
      sql`SELECT ledger_id FROM ledgers WHERE company_id = ${companyId} AND ledger_type = 'Cash' LIMIT 1`
    );
    cashLedgerId = cashRows[0].ledger_id;

    const debtorGroupId = await fetchGroupId("Sundry Debtors");
    const salesGroupId = await fetchGroupId("Sales Accounts");

    const debtor = await ledgerService.create({
      company_id: companyId, group_id: debtorGroupId,
      name: "Bill Vouchers Debtor", nature: "Assets", is_bill_wise: 1,
    });
    debtorLedgerId = Number(debtor.ledger_id || debtor.ledger?.ledger_id);

    const salesLedger = await ledgerService.create({
      company_id: companyId, group_id: salesGroupId, name: "Bill Vouchers Sales", nature: "Income",
    });
    salesLedgerId = Number(salesLedger.ledger_id || salesLedger.ledger?.ledger_id);

    // Unique symbol to avoid collision with any predefined seeded unit.
    const unit = await unitService.create({ company_id: companyId, name: "BV Units", symbol: "bvu" });
    expect(unit.success).toBe(true);
    unitId = unit.unit?.unit_id ?? unit.unitId ?? unit.id;

    const item = await stockItemService.create({ company_id: companyId, name: "Apple", unit_id: unitId });
    itemId = item.item?.item_id ?? item.itemId ?? item.id;

    // Original bill (New Ref).
    const sale = await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Journal", date: "2026-04-10",
      is_accounting_voucher: 1, narration: "Credit sale",
      entries: [
        { ledger_id: debtorLedgerId, type: "Dr", amount: SALE_AMOUNT },
        { ledger_id: salesLedgerId, type: "Cr", amount: SALE_AMOUNT },
      ],
      bill_references: [
        { ledger_id: debtorLedgerId, bill_name: BILL_NAME, bill_type: "New Ref", amount: SALE_AMOUNT, due_date: "2026-04-10" },
      ],
    });
    expect(sale.success).toBe(true);

    // Partial settlement against the same bill (Agst Ref).
    const receipt = await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Receipt", date: "2026-04-20",
      is_accounting_voucher: 1, narration: "Partial receipt against INV-BV-001",
      entries: [
        { ledger_id: cashLedgerId, type: "Dr", amount: SETTLEMENT_AMOUNT },
        { ledger_id: debtorLedgerId, type: "Cr", amount: SETTLEMENT_AMOUNT },
      ],
      bill_references: [
        { ledger_id: debtorLedgerId, bill_name: BILL_NAME, bill_type: "Agst Ref", amount: SETTLEMENT_AMOUNT },
      ],
    });
    expect(receipt.success).toBe(true);

    // Inventory sale carrying a stock item, on its own bill — drives the stock_items assertion.
    const stockSale = await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Sales", date: "2026-07-02",
      party_name: "Bill Vouchers Debtor", is_invoice: 1, is_inventory_voucher: 1, is_accounting_voucher: 1,
      party_ledger_id: debtorLedgerId,
      entries: [
        { ledger_id: debtorLedgerId, type: "Dr", amount: STOCK_QTY * STOCK_RATE },
        { ledger_id: salesLedgerId, type: "Cr", amount: STOCK_QTY * STOCK_RATE },
      ],
      stock_entries: [
        { stock_item_id: itemId, item_name: "Apple", unit_id: unitId, quantity: STOCK_QTY, rate: STOCK_RATE },
      ],
      bill_references: [
        { ledger_id: debtorLedgerId, bill_name: STOCK_BILL_NAME, bill_type: "New Ref", amount: STOCK_QTY * STOCK_RATE, due_date: "2026-07-02" },
      ],
    });
    expect(stockSale.success).toBe(true);
  });

  it("lists both the original bill and its settlement voucher, tagged Dr/Cr", async () => {
    const res = await outstandingReportService.billVouchers(companyId, fyId, debtorLedgerId, BILL_NAME);
    expect(res.success).toBe(true);
    expect(res.rows).toHaveLength(2);

    const sale = res.rows.find((r) => r.voucher_type === "Journal");
    const receipt = res.rows.find((r) => r.voucher_type === "Receipt");

    expect(sale).toBeDefined();
    expect(sale.amount).toBeCloseTo(SALE_AMOUNT, 2);
    expect(sale.entry_type).toBe("Dr");
    expect(sale.bill_type).toBe("New Ref");

    expect(receipt).toBeDefined();
    expect(receipt.amount).toBeCloseTo(SETTLEMENT_AMOUNT, 2);
    expect(receipt.entry_type).toBe("Cr");
    expect(receipt.bill_type).toBe("Agst Ref");
  });

  it("includes stock item lines (qty, item, rate, unit) under an inventory voucher", async () => {
    const res = await outstandingReportService.billVouchers(companyId, fyId, debtorLedgerId, STOCK_BILL_NAME);
    expect(res.success).toBe(true);
    expect(res.rows).toHaveLength(1);

    const voucher = res.rows[0];
    expect(voucher.voucher_type).toBe("Sales");
    expect(Array.isArray(voucher.stock_items)).toBe(true);
    expect(voucher.stock_items).toHaveLength(1);

    const item = voucher.stock_items[0];
    expect(item.item_name).toBe("Apple");
    expect(item.quantity).toBeCloseTo(STOCK_QTY, 2);
    expect(item.rate).toBeCloseTo(STOCK_RATE, 2);
    expect(item.unit_symbol).toBe("bvu");
  });

  it("returns an empty list for a bill with no vouchers", async () => {
    const res = await outstandingReportService.billVouchers(companyId, fyId, debtorLedgerId, "NO-SUCH-BILL");
    expect(res.success).toBe(true);
    expect(res.rows).toEqual([]);
  });
});
