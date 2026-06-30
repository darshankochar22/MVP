// Verification test for the Reversing Journal voucher — a non-posting "scenario"
// voucher in TallyPrime. Mirrors exactly what useVoucherForm builds on submit and
// confirms the backend:
//   - creates a balanced Reversing Journal (Dr = Cr), incl. with Cash/Bank ledgers
//   - persists voucher_type, is_optional = 1, and the "Applicable Upto" date
//   - excludes it from ledger balances (is_optional filtered) — it must NOT post to
//     the books, matching Tally's reversing-journal behaviour

const { setupTestDB, createTestCompany, db } = require("./helpers");
const voucherService = require("../voucher/voucherService");

describe("Reversing Journal persistence + non-posting behaviour", () => {
  let companyId, fyId, cashLedgerId, plLedgerId, voucherId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Reversing Journal Co");
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
    cashLedgerId = ledgersResult.rows.find((l) => l.name === "Cash").ledger_id;
    plLedgerId = ledgersResult.rows.find((l) => l.name === "Profit & Loss A/c").ledger_id;

    // Mirrors exactly what useVoucherForm builds for a Reversing Journal submit:
    // balanced Dr/Cr entries, is_accounting_voucher = 1 (server validates balance),
    // is_optional = 1 (non-posting), plus the Applicable Upto date.
    const res = await voucherService.create({
      company_id: companyId,
      fy_id: fyId,
      voucher_type: "Reversing Journal",
      date: "2026-04-01",
      narration: "Provisional entry",
      is_accounting_voucher: 1,
      is_optional: 1,
      applicable_upto: "2026-04-30",
      entries: [
        { ledger_id: cashLedgerId, ledger_name: "Cash", type: "Dr", amount: 900 },
        { ledger_id: plLedgerId, ledger_name: "Profit & Loss A/c", type: "Cr", amount: 900 },
      ],
    });
    expect(res.success).toBe(true);
    voucherId = res.voucher.voucher_id;
  });

  it("rejects an unbalanced Reversing Journal (server validates Dr = Cr)", async () => {
    const res = await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Reversing Journal",
      date: "2026-04-02", is_accounting_voucher: 1, is_optional: 1, applicable_upto: "2026-04-30",
      entries: [
        { ledger_id: cashLedgerId, ledger_name: "Cash", type: "Dr", amount: 900 },
        { ledger_id: plLedgerId, ledger_name: "Profit & Loss A/c", type: "Cr", amount: 800 },
      ],
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain("Debit and Credit amounts must be equal");
  });

  it("persists voucher_type, is_optional and the Applicable Upto date", async () => {
    const res = await voucherService.getById(voucherId);
    expect(res.success).toBe(true);
    expect(res.voucher.voucher_type).toBe("Reversing Journal");
    expect(Number(res.voucher.is_optional)).toBe(1);
    expect(res.voucher.applicable_upto).toBe("2026-04-30");

    expect(res.voucher.entries.length).toBe(2);
    const dr = res.voucher.entries.find((e) => e.type === "Dr");
    const cr = res.voucher.entries.find((e) => e.type === "Cr");
    expect(Number(dr.amount)).toBe(900);
    expect(Number(cr.amount)).toBe(900);
  });

  it("does NOT post to the books — excluded from ledger balances (is_optional)", async () => {
    // The 900 Dr on Cash must not move its balance: a Reversing Journal is a
    // scenario-only voucher and getLedgerBalance filters out is_optional = 1.
    const bal = await voucherService.getLedgerBalance(cashLedgerId, companyId, fyId);
    expect(bal.success).toBe(true);
    expect(bal.totalDr).toBe(0);

    // Contrast: a regular (non-optional) voucher DOES move the balance, proving the
    // exclusion above is specifically due to is_optional, not a dead query.
    await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Journal",
      date: "2026-04-03", is_accounting_voucher: 1,
      entries: [
        { ledger_id: cashLedgerId, ledger_name: "Cash", type: "Dr", amount: 500 },
        { ledger_id: plLedgerId, ledger_name: "Profit & Loss A/c", type: "Cr", amount: 500 },
      ],
    });
    const bal2 = await voucherService.getLedgerBalance(cashLedgerId, companyId, fyId);
    expect(bal2.totalDr).toBe(500);
  });
});
