// Delivery Note / Receipt Note / Rejection In / Rejection Out are non-accounting
// inventory vouchers in Tally — no Sales/Purchase ledger is ever posted against
// the party, unlike Sales/Purchase/Credit Note/Debit Note.
//
// Regression guard for a dead-UI bug: their Create form used to show a required
// "Sales Ledger"/"Purchase Ledger" field (StockTransferVoucherBody) whose value
// was captured in React state but never sent to the server — useVoucherForm
// always built an empty `entries` array for these voucher types. The fix removed
// that field (and its mandatory validation) so the Create form no longer promises
// a persisted effect it can't deliver. This test locks in the backend contract
// those voucher types actually rely on: they persist as pure stock movements with
// zero voucher_entries rows and no effect on any ledger's balance.

const { setupTestDB, createTestCompany, db } = require("./helpers");
const voucherService = require("../voucher/voucherService");
const ledgerService = require("../ledger/ledgerService");

const ledgerId = (res) => res.ledger?.ledger_id ?? res.ledger_id ?? res.id;

describe("Delivery/Receipt/Rejection vouchers stay non-accounting", () => {
  let companyId, fyId, partyId, salesLedgerId, purchaseLedgerId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Inventory Voucher Co");
    companyId = company.company_id;
    const fy = await db.execute(
      `SELECT fy_id FROM financial_years WHERE company_id = ? AND is_active = 1`,
      [companyId]
    );
    fyId = fy.rows[0].fy_id;

    partyId = ledgerId(await ledgerService.create({ company_id: companyId, name: "Retail Customer" }));
    // Ledgers a user could have picked in the old (now-removed) Sales/Purchase
    // Ledger field — proving they stay untouched confirms nothing silently posts.
    salesLedgerId = ledgerId(await ledgerService.create({ company_id: companyId, name: "Sales A/c" }));
    purchaseLedgerId = ledgerId(await ledgerService.create({ company_id: companyId, name: "Purchase A/c" }));
  });

  it("Delivery Note persists the stock movement with zero accounting entries", async () => {
    const res = await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: "Delivery Note",
      date: "2026-04-01", party_ledger_id: partyId, party_name: "Retail Customer",
      is_accounting_voucher: 0, is_inventory_voucher: 1, is_order_voucher: 1,
      // Mirrors exactly what useVoucherForm's handleSubmit sends for this voucher
      // type: entries is always [] (isInventoryOnly gate), only stock_entries carry data.
      entries: [],
      stock_entries: [{ item_name: "Widget", quantity: 5, rate: 200, amount: 1000 }],
    });
    expect(res.success).toBe(true);

    const back = await voucherService.getById(res.voucher.voucher_id);
    expect(back.success).toBe(true);
    expect(back.voucher.entries.length).toBe(0);
    expect(Number(back.voucher.is_accounting_voucher)).toBe(0);
    expect(back.voucher.stock_entries.length).toBe(1);
    expect(Number(back.voucher.stock_entries[0].quantity)).toBe(5);

    const bal = await voucherService.getLedgerBalance(salesLedgerId, companyId, fyId);
    expect(bal.success).toBe(true);
    expect(bal.totalDr).toBe(0);
    expect(bal.totalCr).toBe(0);
  });

  it.each([
    ["Receipt Note", () => purchaseLedgerId],
    ["Rejection In", () => salesLedgerId],
    ["Rejection Out", () => purchaseLedgerId],
  ])("%s persists the stock movement with zero accounting entries", async (voucherType, pickLedgerId) => {
    const res = await voucherService.create({
      company_id: companyId, fy_id: fyId, voucher_type: voucherType,
      date: "2026-04-02", party_ledger_id: partyId, party_name: "Retail Customer",
      is_accounting_voucher: 0, is_inventory_voucher: 1, is_order_voucher: 1,
      entries: [],
      stock_entries: [{ item_name: "Widget", quantity: 2, rate: 200, amount: 400 }],
    });
    expect(res.success).toBe(true);

    const back = await voucherService.getById(res.voucher.voucher_id);
    expect(back.voucher.entries.length).toBe(0);
    expect(Number(back.voucher.is_accounting_voucher)).toBe(0);

    const bal = await voucherService.getLedgerBalance(pickLedgerId(), companyId, fyId);
    expect(bal.totalDr).toBe(0);
    expect(bal.totalCr).toBe(0);
  });
});
