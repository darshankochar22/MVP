const { setupTestDB } = require("./helpers");
const { rawDb } = require("../db/index");
const wa = require("../whatsapp/whatsappService");

let companyId;

const WA_ENV = [
  "WHATSAPP_PROVIDER", "WHATSAPP_API_KEY", "WHATSAPP_TOKEN",
  "WHATSAPP_BASE_URL", "WHATSAPP_NUMBER", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_WABA_ID",
];
const clearEnv = () => WA_ENV.forEach((k) => delete process.env[k]);

beforeAll(async () => {
  await setupTestDB();
  await rawDb.execute(`INSERT INTO companies (name) VALUES ('WA Test Co')`);
  const rows = await rawDb.execute(`SELECT company_id FROM companies WHERE name = 'WA Test Co' LIMIT 1`);
  companyId = rows.rows[0].company_id;
});

afterEach(() => clearEnv());

describe("WhatsApp service (developer-side credentials)", () => {
  it("reports not-configured when no env credentials are set", async () => {
    clearEnv();
    const st = await wa.getStatus(companyId);
    expect(st.success).toBe(true);
    expect(st.configured).toBe(false);
  });

  it("guards sends when not configured (no throw)", async () => {
    clearEnv();
    const r = await wa.sendText(companyId, "9876543210", "hi");
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/not configured/i);
  });

  it("reads the connection from env and never leaks the secret", async () => {
    process.env.WHATSAPP_PROVIDER = "wati";
    process.env.WHATSAPP_BASE_URL = "https://live-server-00000.wati.io";
    process.env.WHATSAPP_NUMBER = "919876500000";
    process.env.WHATSAPP_API_KEY = "super-secret-wati-key-1234567890";

    const st = await wa.getStatus(companyId);
    expect(st.configured).toBe(true);
    expect(st.source).toBe("env");
    expect(st.provider).toBe("wati");
    expect(st.displayNumber).toBe("919876500000");
    expect(st.masked).toBeTruthy();
    // The renderer-facing status must NEVER carry the raw secret.
    expect(JSON.stringify(st)).not.toContain("super-secret-wati-key");
  });

  it("imports party contacts and lists them as conversations", async () => {
    const imp = await wa.importContacts(companyId, [
      { name: "Acme Traders", phone: "98765 43210", ledger_id: 11 },
      { name: "Globex", phone: "+91 90000 00000", ledger_id: 12 },
    ]);
    expect(imp.success).toBe(true);
    expect(imp.added).toBe(2);

    const convos = await wa.getConversations(companyId);
    expect(convos.success).toBe(true);
    expect(convos.contacts.length).toBe(2);
    const phones = convos.contacts.map((c) => c.phone).sort();
    expect(phones).toEqual(["919000000000", "919876543210"]);
  });

  it("normalizes Indian numbers consistently", () => {
    expect(wa.normalizePhone("9876543210")).toBe("919876543210");
    expect(wa.normalizePhone("09876543210")).toBe("919876543210");
    expect(wa.normalizePhone("+91 98765-43210")).toBe("919876543210");
    expect(wa.normalizePhone("919876543210")).toBe("919876543210");
  });

  it("returns logs and templates without error", async () => {
    const logs = await wa.getLogs(companyId);
    expect(logs.success).toBe(true);
    expect(Array.isArray(logs.logs)).toBe(true);

    const tpl = await wa.getTemplates(companyId);
    expect(tpl.success).toBe(true);
    expect(Array.isArray(tpl.templates)).toBe(true);
  });

  it("records a campaign even with no recipients", async () => {
    const run = await wa.runCampaign(companyId, {
      name: "Diwali Greetings",
      template_name: "festival_greeting",
      recipients: [],
    });
    expect(run.success).toBe(true);
    expect(run.total).toBe(0);

    const list = await wa.getCampaigns(companyId);
    expect(list.success).toBe(true);
    expect(list.campaigns.length).toBe(1);
    expect(list.campaigns[0].status).toBe("DONE");
  });
});
