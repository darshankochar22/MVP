const { setupTestDB } = require("./helpers");
const { rawDb } = require("../db/index");
const eInvoice = require("../eInvoice/eInvoiceService");
const ewayBill = require("../ewayBill/ewayBillService");
const gstFiling = require("../gstFiling/gstFilingService");
const { buildIrnPayload } = require("../eInvoice/eInvoicePayload");

let companyId;

const GST_ENV = ["GST_PROVIDER", "GST_GSTIN", "GST_CLIENT_ID", "GST_CLIENT_SECRET", "GST_USERNAME", "GST_PASSWORD", "GST_APP_KEY", "GST_FILING_BASE_URL", "GST_FILING_API_KEY"];
const clearEnv = () => GST_ENV.forEach((k) => delete process.env[k]);

beforeAll(async () => {
  await setupTestDB();
  await rawDb.execute(`INSERT INTO companies (name) VALUES ('GST Test Co')`);
  const rows = await rawDb.execute(`SELECT company_id FROM companies WHERE name = 'GST Test Co' LIMIT 1`);
  companyId = rows.rows[0].company_id;
});

afterEach(() => clearEnv());

describe("GST integrations — config & status", () => {
  it("e-Invoice/e-Way/GST-Filing all report not-configured without env creds", async () => {
    clearEnv();
    expect((await eInvoice.getStatus(companyId)).configured).toBe(false);
    expect((await ewayBill.getStatus(companyId)).configured).toBe(false);
    expect((await gstFiling.getStatus(companyId)).configured).toBe(false);
  });

  it("reads e-Invoice connection from env and never exposes the secret", async () => {
    process.env.GST_PROVIDER = "nic";
    process.env.GST_GSTIN = "27AAAAA0000A1Z5";
    process.env.GST_CLIENT_ID = "cid-123";
    process.env.GST_CLIENT_SECRET = "super-secret-client";
    process.env.GST_USERNAME = "apiuser";
    process.env.GST_PASSWORD = "super-secret-pass";

    const st = await eInvoice.getStatus(companyId);
    expect(st.configured).toBe(true);
    expect(st.provider).toBe("nic");
    expect(st.gstin).toBe("27AAAAA0000A1Z5");
    const json = JSON.stringify(st);
    expect(json).not.toContain("super-secret-client");
    expect(json).not.toContain("super-secret-pass");
  });
});

describe("e-Invoice payload builder", () => {
  it("maps a voucher to a NIC IRN payload with correct totals", () => {
    const voucher = {
      voucher_id: 1, voucher_number: "INV-1", date: "2026-06-30", party_name: "Acme",
      stock_entries: [
        { item_name: "Widget", hsn_code: "1234", quantity: 2, rate: 100, gst_rate: 18, cgst_amount: 18, sgst_amount: 18, igst_amount: 0, discount_amount: 0, unit: "NOS" },
      ],
      entries: [],
    };
    const seller = { gstin: "27AAAAA0000A1Z5", name: "My Co", addr: "Street", loc: "Mumbai", pin: "400001", state: "Maharashtra" };
    const buyer = { gstin: "27BBBBB0000B1Z5", name: "Acme", addr: "Road", loc: "Pune", pin: "411001", state: "Maharashtra" };

    const p = buildIrnPayload(voucher, seller, buyer);
    expect(p.Version).toBe("1.1");
    expect(p.DocDtls.No).toBe("INV-1");
    expect(p.DocDtls.Dt).toBe("30/06/2026");
    expect(p.ItemList).toHaveLength(1);
    expect(p.ItemList[0].TotAmt).toBe(200);
    expect(p.ItemList[0].TotItemVal).toBe(236); // 200 + 18 + 18
    expect(p.ValDtls.AssVal).toBe(200);
    expect(p.ValDtls.CgstVal).toBe(18);
    expect(p.ValDtls.SgstVal).toBe(18);
    expect(p.ValDtls.TotInvVal).toBe(236);
    expect(p.SellerDtls.Stcd).toBe("27");
    expect(p.BuyerDtls.Stcd).toBe("27");
    expect(p.SellerDtls.Pin).toBe(400001);
  });
});

describe("guards & records", () => {
  it("e-Invoice generateFromVoucher fails clearly for a missing voucher", async () => {
    const r = await eInvoice.generateFromVoucher(companyId, 999999);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/voucher not found/i);
  });

  it("e-Way Bill generateFromVoucher requires an IRN first", async () => {
    const r = await ewayBill.generateFromVoucher(companyId, 999999, {});
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/e-Invoice|IRN/i);
  });

  it("records/filings lists start empty and don't throw", async () => {
    expect((await eInvoice.getRecords(companyId)).records).toEqual([]);
    expect((await ewayBill.getRecords(companyId)).records).toEqual([]);
    expect((await gstFiling.getFilings(companyId)).filings).toEqual([]);
  });
});
