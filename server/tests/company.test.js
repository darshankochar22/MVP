const { setupTestDB, db } = require("./helpers");
const companyService = require("../company/companyService");

beforeAll(async () => {
  await setupTestDB();
});

describe("Company Service Tests", () => {
  let companyId;

  it("should successfully create a new company and seed default values", async () => {
    const data = {
      name: "Company Test Corp",
      mailing_name: "Company Test Corp Co.",
      address1: "123 Test Street",
      address2: "Suite 400",
      state: "Maharashtra",
      country: "India",
      pincode: "400001",
      telephone: "022-1234567",
      mobile: "9876543210",
      fax: "022-7654321",
      email: "test@companycorp.com",
      website: "www.companycorp.com",
      base_currency_symbol: "₹",
      formal_name: "INR",
      financial_year_beginning_from: "2026-04-01",
      books_beginning_from: "2026-04-01",
      password: "secure_password",
    };

    const result = await companyService.create(data);
    expect(result.success).toBe(true);
    expect(result.company).toBeDefined();
    expect(result.company.company_id).toBeDefined();
    companyId = result.company.company_id;

    // Verify defaults seeded
    const groups = await db.execute(`SELECT COUNT(*) as count FROM groups WHERE company_id = ?`, [companyId]);
    expect(Number(groups.rows[0].count)).toBeGreaterThan(0);

    const ledgers = await db.execute(`SELECT COUNT(*) as count FROM ledgers WHERE company_id = ?`, [companyId]);
    expect(Number(ledgers.rows[0].count)).toBeGreaterThan(0);

    const currencies = await db.execute(`SELECT COUNT(*) as count FROM currencies WHERE company_id = ?`, [companyId]);
    expect(Number(currencies.rows[0].count)).toBeGreaterThan(0);

    const voucherTypes = await db.execute(`SELECT COUNT(*) as count FROM voucher_types WHERE company_id = ?`, [companyId]);
    expect(Number(voucherTypes.rows[0].count)).toBeGreaterThan(0);
  });

  it("should list all companies", async () => {
    const result = await companyService.getAll();
    expect(result.success).toBe(true);
    expect(result.companies.length).toBeGreaterThanOrEqual(1);
  });

  it("should fetch company by id", async () => {
    const result = await companyService.getById(companyId);
    expect(result.success).toBe(true);
    expect(result.company.name).toBe("Company Test Corp");
  });

  it("should verify company password", async () => {
    const match = await companyService.verifyPassword(companyId, "secure_password");
    expect(match.success).toBe(true);

    const mismatch = await companyService.verifyPassword(companyId, "wrong_password");
    expect(mismatch.success).toBe(false);
  });

  it("should update company information", async () => {
    const updateData = {
      company_id: companyId,
      name: "Updated Company Test Corp",
      address1: "456 Updated Ave",
    };

    const result = await companyService.update(updateData);
    expect(result.success).toBe(true);
    expect(result.company.name).toBe("Updated Company Test Corp");
    expect(result.company.address1).toBe("456 Updated Ave");
  });
});
