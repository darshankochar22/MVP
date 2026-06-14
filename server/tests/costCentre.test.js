const { setupTestDB, createTestCompany } = require("./helpers");
const costCentreService = require("../costCentre/costCentreService");

describe("Cost Centre Service Tests", () => {
  let companyId;
  let parentCcId;
  let childCcId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Cost Centre Test Co");
    companyId = company.company_id;
  });

  it("should create a primary cost centre", async () => {
    const data = {
      company_id: companyId,
      name: "Mumbai Division",
      alias: "MUM-DIV",
    };
    const res = await costCentreService.create(data);
    expect(res.success).toBe(true);
    expect(res.costCentre.cc_id).toBeDefined();
    expect(res.costCentre.category).toBe("Primary");
    parentCcId = res.costCentre.cc_id;
  });

  it("should create a secondary cost centre under a parent", async () => {
    const data = {
      company_id: companyId,
      name: "Mumbai Sales Team",
      parent_id: parentCcId,
    };
    const res = await costCentreService.create(data);
    expect(res.success).toBe(true);
    expect(res.costCentre.parent_id).toBe(parentCcId);
    expect(res.costCentre.category).toBe("Secondary");
    childCcId = res.costCentre.cc_id;
  });

  it("should get cost centre tree hierarchy", async () => {
    const res = await costCentreService.getTree(companyId);
    expect(res.success).toBe(true);
    expect(res.tree.length).toBe(1);
    expect(res.tree[0].name).toBe("Mumbai Division");
    expect(res.tree[0].children.length).toBe(1);
    expect(res.tree[0].children[0].name).toBe("Mumbai Sales Team");
  });

  it("should update a cost centre", async () => {
    const updateData = {
      cc_id: childCcId,
      alias: "MUM-SALES",
    };
    const res = await costCentreService.update(updateData);
    expect(res.success).toBe(true);
    expect(res.costCentre.alias).toBe("MUM-SALES");
  });

  it("should prevent deleting cost centre if it has sub-centres", async () => {
    const res = await costCentreService.delete(parentCcId);
    expect(res.success).toBe(false);
    expect(res.error).toContain("Cannot delete Cost Centre with sub-centres");
  });

  it("should delete leaf cost centre successfully", async () => {
    const res1 = await costCentreService.delete(childCcId);
    expect(res1.success).toBe(true);

    const res2 = await costCentreService.delete(parentCcId);
    expect(res2.success).toBe(true);
  });
});
