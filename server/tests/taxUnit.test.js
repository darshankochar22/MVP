const { setupTestDB, createTestCompany } = require("./helpers");
const taxUnitService = require("../taxUnits/taxUnitServices");

describe("Tax Units Service Tests", () => {
  let companyId;
  let taxUnitId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Tax Unit Test Co");
    companyId = company.company_id;
  });

  it("should create a new tax unit", async () => {
    const data = {
      company_id: companyId,
      name: "Excise Unit Mumbai",
      alias: "EUM",
      address_line1: "Mumbai Port Trust",
      state: "Maharashtra",
      pincode: "400001",
      telephone: "022-1234568",
      registered_for: "Excise",
      set_alter_excise_details: 1,
      registration_type: "Importer",
      ecc_number: "AAACG1234EX001",
      set_alter_excise_tariff: 1,
      set_alter_rule11_book: 0,
    };

    const result = await taxUnitService.create(data);
    expect(result.success).toBe(true);
    expect(result.taxUnit).toBeDefined();
    expect(result.taxUnit.tax_unit_id).toBeDefined();
    taxUnitId = result.taxUnit.tax_unit_id;
  });

  it("should fail creating tax unit with duplicate name", async () => {
    const duplicateData = {
      company_id: companyId,
      name: "Excise Unit Mumbai",
    };
    const result = await taxUnitService.create(duplicateData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("already exists");
  });

  it("should get all tax units for a company", async () => {
    const result = await taxUnitService.getAll(companyId);
    expect(result.success).toBe(true);
    expect(result.taxUnits.length).toBe(1);
    expect(result.taxUnits[0].name).toBe("Excise Unit Mumbai");
  });

  it("should get tax unit by id", async () => {
    const result = await taxUnitService.getById(taxUnitId);
    expect(result.success).toBe(true);
    expect(result.taxUnit.alias).toBe("EUM");
  });

  it("should update a tax unit", async () => {
    const updateData = {
      tax_unit_id: taxUnitId,
      alias: "EUM-Updated",
      set_alter_excise_tariff: 0,
    };

    const result = await taxUnitService.update(updateData);
    expect(result.success).toBe(true);
    expect(result.taxUnit.alias).toBe("EUM-Updated");
    expect(result.taxUnit.set_alter_excise_tariff).toBe(0);
  });

  it("should soft delete a tax unit", async () => {
    const delResult = await taxUnitService.delete(taxUnitId);
    expect(delResult.success).toBe(true);

    const listResult = await taxUnitService.getAll(companyId);
    expect(listResult.success).toBe(true);
    expect(listResult.taxUnits.length).toBe(0);
  });
});
