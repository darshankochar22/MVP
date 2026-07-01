// Bills Receivable/Payable drill-down: outstandingReportService.billVouchers() lists the
// vouchers (original bill + any Agst Ref settlements) that make up one bill row, before
// the frontend opens a specific voucher — mirrors parityReports.test.js's fixture style.

const { setupTestDB, createTestCompany, db } = require("./helpers");
const { sql } = require("drizzle-orm");
const voucherService = require("../voucher/voucherService");
const ledgerService = require("../ledger/ledgerService");
const outstandingReportService = require("../report/outstandingReportService");

describe("outstandingReportService.billVouchers", () => {
  let companyId, fyId, debtorLedgerId, cashLedgerId, salesLedgerId;
  const BILL_NAME = "INV-BV-001";
  const SALE_AMOUNT = 50000;
  const SETTLEMENT_AMOUNT = 20000;

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

  it("returns an empty list for a bill with no vouchers", async () => {
    const res = await outstandingReportService.billVouchers(companyId, fyId, debtorLedgerId, "NO-SUCH-BILL");
    expect(res.success).toBe(true);
    expect(res.rows).toEqual([]);
  });
});
