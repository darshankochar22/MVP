// Ledger Outstandings report shape: outstandingReportService.ledgerOutstandings()
// returns per-bill Opening Amount (original New Ref/Advance value) and Pending
// Amount (net after Agst Ref settlements), both signed Dr(+)/Cr(-), plus a
// separate On Account aggregate and a Sub Total. Mirrors billVouchers.test.js fixtures.

const { setupTestDB, createTestCompany, db } = require("./helpers");
const { sql } = require("drizzle-orm");
const voucherService = require("../voucher/voucherService");
const ledgerService = require("../ledger/ledgerService");
const outstandingReportService = require("../report/outstandingReportService");

describe("outstandingReportService.ledgerOutstandings", () => {
  let companyId, fyId, debtorLedgerId, cashLedgerId, salesLedgerId;

  const INV = "LO-INV-1";   // sale, partially settled
  const CN = "LO-CN-1";     // credit note (Cr bill)
  const SALE = 50000;
  const SETTLE = 20000;     // partial receipt against INV
  const CREDIT = 8000;      // credit note amount (Cr on the debtor)
  const ON_ACCOUNT = 5000;  // unallocated receipt

  const fetchGroupId = async (groupName) => {
    const rows = await db.all(
      sql`SELECT group_id FROM groups WHERE company_id = ${companyId} AND name = ${groupName} LIMIT 1`
    );
    return rows[0].group_id;
  };

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Ledger Outstandings Co");
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

    const debtor = await ledgerService.create({
      company_id: companyId, group_id: await fetchGroupId("Sundry Debtors"),
      name: "LO Debtor", nature: "Assets", is_bill_wise: 1,
    });
    debtorLedgerId = Number(debtor.ledger_id || debtor.ledger?.ledger_id);

    const salesLedger = await ledgerService.create({
      company_id: companyId, group_id: await fetchGroupId("Sales Accounts"), name: "LO Sales", nature: "Income",
    });
    salesLedgerId = Number(salesLedger.ledger_id || salesLedger.ledger?.ledger_id);

    // Sale — New Ref, Dr on the debtor.
    await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Journal", date: "2026-04-10",
      is_accounting_voucher: 1,
      entries: [
        { ledger_id: debtorLedgerId, type: "Dr", amount: SALE },
        { ledger_id: salesLedgerId, type: "Cr", amount: SALE },
      ],
      bill_references: [
        { ledger_id: debtorLedgerId, bill_name: INV, bill_type: "New Ref", amount: SALE, due_date: "2026-04-10" },
      ],
    });

    // Partial receipt — Agst Ref, Cr on the debtor. Pending on INV drops to 30,000.
    await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Receipt", date: "2026-04-20",
      is_accounting_voucher: 1,
      entries: [
        { ledger_id: cashLedgerId, type: "Dr", amount: SETTLE },
        { ledger_id: debtorLedgerId, type: "Cr", amount: SETTLE },
      ],
      bill_references: [
        { ledger_id: debtorLedgerId, bill_name: INV, bill_type: "Agst Ref", amount: SETTLE },
      ],
    });

    // Credit note — New Ref, Cr on the debtor (negative / Cr bill).
    await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Journal", date: "2026-05-10",
      is_accounting_voucher: 1,
      entries: [
        { ledger_id: salesLedgerId, type: "Dr", amount: CREDIT },
        { ledger_id: debtorLedgerId, type: "Cr", amount: CREDIT },
      ],
      bill_references: [
        { ledger_id: debtorLedgerId, bill_name: CN, bill_type: "New Ref", amount: CREDIT },
      ],
    });

    // Unallocated receipt — On Account, Cr on the debtor.
    await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Receipt", date: "2026-06-01",
      is_accounting_voucher: 1,
      entries: [
        { ledger_id: cashLedgerId, type: "Dr", amount: ON_ACCOUNT },
        { ledger_id: debtorLedgerId, type: "Cr", amount: ON_ACCOUNT },
      ],
      bill_references: [
        { ledger_id: debtorLedgerId, bill_name: "On Account", bill_type: "On Account", amount: ON_ACCOUNT },
      ],
    });
  });

  it("reports Opening vs Pending per bill with Dr/Cr signs", async () => {
    const res = await outstandingReportService.ledgerOutstandings(companyId, fyId, debtorLedgerId);
    expect(res.success).toBe(true);

    const inv = res.rows.find((r) => r.bill === INV);
    expect(inv).toBeDefined();
    expect(inv.opening_amount).toBeCloseTo(SALE, 2);          // +50,000 Dr (original)
    expect(inv.pending_amount).toBeCloseTo(SALE - SETTLE, 2); // +30,000 Dr (after receipt)

    const cn = res.rows.find((r) => r.bill === CN);
    expect(cn).toBeDefined();
    expect(cn.opening_amount).toBeCloseTo(-CREDIT, 2);        // -8,000 => Cr
    expect(cn.pending_amount).toBeCloseTo(-CREDIT, 2);
  });

  it("sums bills into Sub Total and keeps On Account separate", async () => {
    const res = await outstandingReportService.ledgerOutstandings(companyId, fyId, debtorLedgerId);

    expect(res.sub_total.opening).toBeCloseTo(SALE - CREDIT, 2);           // 42,000
    expect(res.sub_total.pending).toBeCloseTo(SALE - SETTLE - CREDIT, 2);  // 22,000

    expect(res.on_account).not.toBeNull();
    expect(res.on_account.amount).toBeCloseTo(-ON_ACCOUNT, 2);             // -5,000 => Cr

    // Total = pending bills + on account.
    expect(res.total).toBeCloseTo(SALE - SETTLE - CREDIT - ON_ACCOUNT, 2); // 17,000
  });

  it("orders bills by date ascending", async () => {
    const res = await outstandingReportService.ledgerOutstandings(companyId, fyId, debtorLedgerId);
    const idxInv = res.rows.findIndex((r) => r.bill === INV);
    const idxCn = res.rows.findIndex((r) => r.bill === CN);
    expect(idxInv).toBeLessThan(idxCn); // 2026-04-10 before 2026-05-10
  });
});
