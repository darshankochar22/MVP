const { setupTestDB, createTestCompany } = require("./helpers");
const currencyService = require("../currency/currencyService");

describe("Currency Service Tests", () => {
  let companyId;
  let baseCurrencyId;
  let customCurrencyId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Currency Test Co");
    companyId = company.company_id;

    // Check base seeded currency
    const res = await currencyService.getAll(companyId);
    expect(res.success).toBe(true);
    expect(res.currencies.length).toBe(1);
    expect(res.currencies[0].iso_code).toBe("INR");
    baseCurrencyId = res.currencies[0].currency_id;
  });

  it("should create a custom currency", async () => {
    const data = {
      company_id: companyId,
      name: "US Dollar",
      formal_name: "United States Dollar",
      iso_code: "USD",
      symbol: "$",
      decimal_places: 2,
    };

    const res = await currencyService.create(data);
    expect(res.success).toBe(true);
    expect(res.currency.currency_id).toBeDefined();
    expect(res.currency.symbol).toBe("$");
    customCurrencyId = res.currency.currency_id;
  });

  it("should prevent duplicate currency creation", async () => {
    const data = {
      company_id: companyId,
      iso_code: "USD",
    };
    const res = await currencyService.create(data);
    expect(res.success).toBe(false);
  });

  it("should get currency by id", async () => {
    const res = await currencyService.getById(customCurrencyId);
    expect(res.success).toBe(true);
    expect(res.currency.iso_code).toBe("USD");
  });

  it("should update custom currency details", async () => {
    const updateData = {
      currency_id: customCurrencyId,
      symbol: "US$",
      suffix_symbol_to_amount: 1,
    };
    const res = await currencyService.update(updateData);
    expect(res.success).toBe(true);
    expect(res.currency.symbol).toBe("US$");
  });

  it("should prevent editing base/predefined currency", async () => {
    const updateData = {
      currency_id: baseCurrencyId,
      name: "Rupees Edit",
    };
    const res = await currencyService.update(updateData);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Cannot edit base currency");
  });

  it("should set custom currency as default currency", async () => {
    const res = await currencyService.setDefault(companyId, customCurrencyId);
    expect(res.success).toBe(true);

    const checkDefault = await currencyService.getById(customCurrencyId);
    expect(checkDefault.currency.is_default).toBe(1);

    const checkOldDefault = await currencyService.getById(baseCurrencyId);
    expect(checkOldDefault.currency.is_default).toBe(0);

    // Revert back
    await currencyService.setDefault(companyId, baseCurrencyId);
  });

  it("should restrict base/default currency deletion", async () => {
    const res = await currencyService.delete(baseCurrencyId);
    expect(res.success).toBe(false);
  });

  it("should delete custom currency successfully", async () => {
    const res = await currencyService.delete(customCurrencyId);
    expect(res.success).toBe(true);

    const list = await currencyService.getAll(companyId);
    const ids = list.currencies.map(c => c.currency_id);
    expect(ids).not.toContain(customCurrencyId);
  });
});
