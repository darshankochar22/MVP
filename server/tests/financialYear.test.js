const { setupTestDB, createTestCompany } = require("./helpers");
const financialYearService = require("../financialYear/financialYearService");

describe("Financial Year Service Tests", () => {
  let companyId;
  let activeFyId;
  let customFyId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("FY Test Co");
    companyId = company.company_id;

    // Retrieve default seeded active financial year
    const res = await financialYearService.getAll(companyId);
    expect(res.success).toBe(true);
    expect(res.financialYears.length).toBe(1);
    activeFyId = res.financialYears[0].fy_id;
  });

  it("should create a new financial year", async () => {
    const data = {
      company_id: companyId,
      start_date: "2027-04-01",
    };
    const res = await financialYearService.create(data);
    expect(res.success).toBe(true);
    expect(res.fy.fy_id).toBeDefined();
    expect(res.fy.is_active).toBe(0);
    customFyId = res.fy.fy_id;
  });

  it("should list all financial years", async () => {
    const res = await financialYearService.getAll(companyId);
    expect(res.success).toBe(true);
    expect(res.financialYears.length).toBe(2);
  });

  it("should get financial year by id", async () => {
    const res = await financialYearService.getById(customFyId);
    expect(res.success).toBe(true);
    expect(res.fy.start_date).toBe("2027-04-01");
  });

  it("should change active financial year", async () => {
    const res = await financialYearService.setActive(customFyId, companyId);
    expect(res.success).toBe(true);

    const activeCheck = await financialYearService.getById(customFyId);
    expect(activeCheck.fy.is_active).toBe(1);

    const oldActiveCheck = await financialYearService.getById(activeFyId);
    expect(oldActiveCheck.fy.is_active).toBe(0);

    // Revert back for other sequential tests
    await financialYearService.setActive(activeFyId, companyId);
  });

  it("should fail to delete an active financial year", async () => {
    const res = await financialYearService.delete(activeFyId);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Cannot delete active financial year");
  });

  it("should successfully delete an inactive financial year", async () => {
    const res = await financialYearService.delete(customFyId);
    expect(res.success).toBe(true);

    const check = await financialYearService.getById(customFyId);
    expect(check.success).toBe(false);
  });
});
