const { setupTestDB, createTestCompany, db } = require("./helpers");
const { sql } = require("drizzle-orm");
const voucherService = require("../voucher/voucherService");
const ledgerService = require("../ledger/ledgerService");
const interestReportService = require("../report/interestReportService");

describe("Interest Reports", () => {
  let companyId;
  let fyId;
  let debtorLedgerId;
  let creditorLedgerId;

  const fetchGroupId = async (groupName) => {
    const rows = await db.all(
      sql`SELECT group_id FROM groups WHERE company_id = ${companyId} AND name = ${groupName} LIMIT 1`
    );
    if (!rows.length) throw new Error(`Group not found: ${groupName}`);
    return rows[0].group_id;
  };

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Interest Test Company");
    companyId = company.company_id;

    const fyResult = await db.execute(
      `SELECT fy_id FROM financial_years WHERE company_id = ? AND is_active = 1`,
      [companyId]
    );
    fyId = fyResult.rows[0].fy_id;

    const debtorGroupId = await fetchGroupId("Sundry Debtors");
    const creditorGroupId = await fetchGroupId("Sundry Creditors");

    // Predefined groups, we create ledgers with interest active
    const debtor = await ledgerService.create({
      company_id: companyId,
      group_id: debtorGroupId,
      name: "ACME Buyer (Interest)",
      nature: "Assets",
      is_bill_wise: 1,
      activate_interest: 1,
      interest_rate: 12,
      interest_style: "365-Day Year",
      interest_balances: "Debit Balances Only",
    });
    expect(debtor.success).toBe(true);
    debtorLedgerId = Number(debtor.ledger_id || debtor.ledger?.ledger_id);

    const creditor = await ledgerService.create({
      company_id: companyId,
      group_id: creditorGroupId,
      name: "Globex Supplier (Interest)",
      nature: "Liabilities",
      is_bill_wise: 1,
      activate_interest: 1,
      interest_rate: 18,
      interest_style: "365-Day Year",
      interest_balances: "Credit Balances Only",
    });
    expect(creditor.success).toBe(true);
    creditorLedgerId = Number(creditor.ledger_id || creditor.ledger?.ledger_id);

    // Default seeded Sales and Purchase ledgers
    const salesRows = await db.all(
      sql`SELECT ledger_id FROM ledgers WHERE company_id = ${companyId} AND name = 'Sales' LIMIT 1`
    );
    const salesLedgerId = salesRows.length > 0 ? salesRows[0].ledger_id : null;

    const purchaseRows = await db.all(
      sql`SELECT ledger_id FROM ledgers WHERE company_id = ${companyId} AND name = 'Purchase' LIMIT 1`
    );
    const purchaseLedgerId = purchaseRows.length > 0 ? purchaseRows[0].ledger_id : null;

    // Seed balanced vouchers
    // 1. Sale to debtor (Dr Debtor / Cr Sales) on 2026-04-01
    await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Journal",
      date: "2026-04-01",
      is_accounting_voucher: 1,
      narration: "Debit sale",
      entries: [
        { ledger_id: debtorLedgerId, type: "Dr", amount: 10000 },
        { ledger_id: salesLedgerId || 1, type: "Cr", amount: 10000 },
      ],
      bill_references: [
        { bill_name: "INV-101", bill_type: "New Ref", amount: 10000, ledger_id: debtorLedgerId }
      ]
    });

    // 2. Purchase from creditor (Dr Purchase / Cr Creditor) on 2026-04-01
    await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Journal",
      date: "2026-04-01",
      is_accounting_voucher: 1,
      narration: "Credit purchase",
      entries: [
        { ledger_id: purchaseLedgerId || 2, type: "Dr", amount: 5000 },
        { ledger_id: creditorLedgerId, type: "Cr", amount: 5000 },
      ],
      bill_references: [
        { bill_name: "INV-201", bill_type: "New Ref", amount: 5000, ledger_id: creditorLedgerId }
      ]
    });
  });

  it("calculates interestReceivable correctly", async () => {
    // 30 days of interest at 12% on 10,000 should be: 10000 * 0.12 * (30 / 365) = 98.63
    const res = await interestReportService.interestReceivable(companyId, fyId, { to_date: "2026-05-01" });
    expect(res.success).toBe(true);
    expect(res.rows.length).toBeGreaterThan(0);
    const row = res.rows.find(r => r.ledger_id === debtorLedgerId);
    expect(row).toBeDefined();
    expect(row.interest_amount).toBeCloseTo(98.63, 1);
  });

  it("calculates interestPayable correctly", async () => {
    // 30 days of interest at 18% on 5,000 should be: 5000 * 0.18 * (30 / 365) = 73.97
    const res = await interestReportService.interestPayable(companyId, fyId, { to_date: "2026-05-01" });
    expect(res.success).toBe(true);
    expect(res.rows.length).toBeGreaterThan(0);
    const row = res.rows.find(r => r.ledger_id === creditorLedgerId);
    expect(row).toBeDefined();
    expect(row.interest_amount).toBeCloseTo(73.97, 1);
  });

  it("calculates ledgerInterest correctly", async () => {
    // Test with object parameters
    const res = await interestReportService.ledgerInterest(companyId, fyId, { ledger_id: debtorLedgerId, to_date: "2026-05-01" });
    expect(res.success).toBe(true);
    expect(res.rows.length).toBeGreaterThan(0);
    expect(res.total_interest).toBeCloseTo(101.92, 1);

    // Test with raw number parameter (legacy / alternative invocation)
    const resLegacy = await interestReportService.ledgerInterest(companyId, fyId, debtorLedgerId);
    expect(resLegacy.success).toBe(true);
  });

  it("calculates billWiseInterest correctly", async () => {
    const res = await interestReportService.billWiseInterest(companyId, fyId, { ledger_id: debtorLedgerId, to_date: "2026-05-01" });
    expect(res.success).toBe(true);
    expect(res.rows.length).toBeGreaterThan(0);
    expect(res.total_interest).toBeCloseTo(98.63, 1);
    expect(res.rows[0].bill_ref).toBe("INV-101");
  });

  it("groupInterest for Sundry Debtors matches interestReceivable", async () => {
    const debtorGroupId = await fetchGroupId("Sundry Debtors");
    const res = await interestReportService.groupInterest(companyId, fyId, { group_id: debtorGroupId, to_date: "2026-05-01" });
    expect(res.success).toBe(true);
    expect(res.group_name).toBe("Sundry Debtors");
    expect(res.nature).toBe("Assets");
    const row = res.rows.find((r) => r.ledger_id === debtorLedgerId);
    expect(row).toBeDefined();
    expect(row.interest_amount).toBeCloseTo(98.63, 1);
  });

  it("groupInterest for Sundry Creditors matches interestPayable", async () => {
    const creditorGroupId = await fetchGroupId("Sundry Creditors");
    const res = await interestReportService.groupInterest(companyId, fyId, { group_id: creditorGroupId, to_date: "2026-05-01" });
    expect(res.success).toBe(true);
    expect(res.group_name).toBe("Sundry Creditors");
    expect(res.nature).toBe("Liabilities");
    const row = res.rows.find((r) => r.ledger_id === creditorLedgerId);
    expect(row).toBeDefined();
    expect(row.interest_amount).toBeCloseTo(73.97, 1);
  });

  it("groupInterest fails without a group_id", async () => {
    const res = await interestReportService.groupInterest(companyId, fyId, {});
    expect(res.success).toBe(false);
  });
});

// ── Engine edge cases (spec table) — pure functions, no DB ─────────────────
const { computeBillInterest, buildSegments, applyRounding } = require("../report/services/interestEngine");

describe("Interest engine edge cases", () => {
  const CFG = { rate: 12, style: "365-Day Year", applicable_from: "Due Date" };
  const mkBill = (over = {}) => ({
    original_amount: 10000,
    bill_date: "2026-04-01",
    due_date: "2026-05-01",
    credit_period: 30,
    settlements: [],
    ...over,
  });

  it("bill fully settled before due date → interest 0", () => {
    const bill = mkBill({ settlements: [{ date: "2026-04-20", amount: 10000 }] });
    const r = computeBillInterest(bill, CFG, "2026-07-01");
    expect(r.interest).toBe(0);
    expect(r.segments).toHaveLength(0);
  });

  it("bill settled exactly on due date → interest 0", () => {
    const bill = mkBill({ settlements: [{ date: "2026-05-01", amount: 10000 }] });
    const r = computeBillInterest(bill, CFG, "2026-07-01");
    expect(r.interest).toBe(0);
  });

  it("report as-on before due date → interest 0", () => {
    const r = computeBillInterest(mkBill(), CFG, "2026-04-15");
    expect(r.interest).toBe(0);
  });

  it("multiple partial payments → piecewise segments, summed", () => {
    // 10000 overdue from 1-May; 4000 paid 31-May; 3000 paid 30-Jun; as on 30-Jul.
    const bill = mkBill({
      settlements: [
        { date: "2026-05-31", amount: 4000 },
        { date: "2026-06-30", amount: 3000 },
      ],
    });
    const r = computeBillInterest(bill, CFG, "2026-07-30");
    expect(r.segments).toHaveLength(3);
    // seg1: 10000 × 12% × 30/365, seg2: 6000 × 30/365, seg3: 3000 × 30/365
    const expected =
      10000 * 0.12 * (30 / 365) + 6000 * 0.12 * (30 / 365) + 3000 * 0.12 * (30 / 365);
    expect(r.interest).toBeCloseTo(expected, 2);
    // A flat calculation on the closing 3000 would give a very different number.
    expect(r.interest).not.toBeCloseTo(3000 * 0.12 * (90 / 365), 1);
  });

  it("overpayment floors pending at 0 — no negative segments", () => {
    const bill = mkBill({ settlements: [{ date: "2026-05-16", amount: 15000 }] });
    const r = computeBillInterest(bill, CFG, "2026-08-01");
    expect(r.segments).toHaveLength(1); // only 1-May → 16-May on 10000
    expect(r.segments[0].amount).toBe(10000);
    expect(r.interest).toBeCloseTo(10000 * 0.12 * (15 / 365), 2);
  });

  it("missing due date + credit period → flagged, accrues from bill date", () => {
    const bill = mkBill({ due_date: null, credit_period: null });
    const r = computeBillInterest(bill, CFG, "2026-05-01");
    expect(r.missing_due_date).toBe(true);
    expect(r.start_date).toBe("2026-04-01");
    expect(r.interest).toBeCloseTo(10000 * 0.12 * (30 / 365), 2);
  });

  it("rate slabs: each date range uses its own rate", () => {
    // 12% base; slab bumps to 18% from 1-Jun.
    const cfg = { ...CFG, slabs: [{ from_date: "2026-06-01", to_date: null, rate: 18 }] };
    const r = computeBillInterest(mkBill(), cfg, "2026-07-01");
    expect(r.segments).toHaveLength(2);
    const expected = 10000 * 0.12 * (31 / 365) + 10000 * 0.18 * (30 / 365);
    expect(r.interest).toBeCloseTo(expected, 2);
  });

  it("rounding methods apply on the bill total", () => {
    expect(applyRounding(98.63, "No Rounding", 1)).toBeCloseTo(98.63, 2);
    expect(applyRounding(98.63, "Round Nearest", 1)).toBe(99);
    expect(applyRounding(98.63, "Round Upward", 1)).toBe(99);
    expect(applyRounding(98.63, "Round Downward", 1)).toBe(98);
    expect(applyRounding(98.63, "Round Nearest", 10)).toBe(100);
  });

  it("applicable_from Bill Date starts at the bill date, not due date", () => {
    const r = computeBillInterest(mkBill(), { ...CFG, applicable_from: "Bill Date" }, "2026-05-01");
    expect(r.start_date).toBe("2026-04-01");
    expect(r.interest).toBeCloseTo(10000 * 0.12 * (30 / 365), 2);
  });

  it("ledger save rejects a non-numeric interest rate", async () => {
    const company = await createTestCompany("Interest Validation Co");
    const groupRows = await db.all(
      sql`SELECT group_id FROM groups WHERE company_id = ${company.company_id} AND name = 'Sundry Debtors' LIMIT 1`
    );
    const res = await ledgerService.create({
      company_id: company.company_id,
      group_id: groupRows[0].group_id,
      name: "Bad Rate Ledger",
      activate_interest: 1,
      interest_rate: "12`",
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/interest rate/i);
  });
});
