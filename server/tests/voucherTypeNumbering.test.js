// Voucher Type — "Set/Alter additional numbering details" sub-screen (issue #143).
//
// The Voucher Type Creation screen exposes, when Method of Voucher Numbering =
// Automatic and "Set/Alter additional numbering details" = Yes, a sub-screen
// (Starting Number, Width of Numerical Part, Prefill with zero, plus Restart
// Numbering / Prefix Details / Suffix Details tables). This test asserts those
// values round-trip through create → getConfig → updateConfig.

const { setupTestDB, createTestCompany, db } = require("./helpers");
const voucherTypeService = require("../voucherType/voucherTypeService");

describe("Voucher Type additional numbering details (issue #143)", () => {
  let companyId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("VT Numbering Co");
    companyId = company.company_id;
  });

  it("persists scalar + restart/prefix/suffix rows on create and reads them back", async () => {
    const created = await voucherTypeService.create({
      company_id: companyId,
      name: "Custom Sales",
      category: "Sales",
      numbering_method: "Automatic",
      set_alter_additional_numbering: 1,
      starting_number: 100,
      width_of_numerical_part: 4,
      prefill_with_zero: 1,
      restart_numbering: [{ applicable_from: "2026-04-01", starting_number: 1, particulars: "Yearly" }],
      prefix_details: [{ applicable_from: "2026-04-01", particulars: "INV/" }],
      suffix_details: [{ applicable_from: "2026-04-01", particulars: "/26-27" }],
    });
    expect(created.success).toBe(true);
    const vtId = created.voucherType.vt_id;

    const cfg = await voucherTypeService.getConfig(vtId);
    expect(cfg.success).toBe(true);
    expect(cfg.config.starting_number).toBe(100);
    expect(cfg.config.width_of_numerical_part).toBe(4);
    expect(cfg.config.prefill_with_zero).toBe(1);
    expect(cfg.config.restart_numbering).toEqual([
      { applicable_from: "2026-04-01", starting_number: 1, particulars: "Yearly" },
    ]);
    expect(cfg.config.prefix_details[0].particulars).toBe("INV/");
    expect(cfg.config.suffix_details[0].particulars).toBe("/26-27");
  });

  it("updateConfig replaces the numbering rows", async () => {
    const created = await voucherTypeService.create({
      company_id: companyId,
      name: "Custom Purchase",
      category: "Purchase",
      numbering_method: "Automatic",
    });
    const vtId = created.voucherType.vt_id;

    const upd = await voucherTypeService.updateConfig({
      voucher_type_id: vtId,
      set_alter_additional_numbering: 1,
      starting_number: 50,
      prefix_details: [{ applicable_from: "2026-04-01", particulars: "PUR-" }],
    });
    expect(upd.success).toBe(true);
    expect(upd.config.starting_number).toBe(50);
    expect(upd.config.prefix_details[0].particulars).toBe("PUR-");

    const cfg = await voucherTypeService.getConfig(vtId);
    expect(cfg.config.prefix_details[0].particulars).toBe("PUR-");
  });

  it("defaults numbering rows to empty arrays when not provided", async () => {
    const created = await voucherTypeService.create({
      company_id: companyId,
      name: "Plain Journal",
      category: "Journal",
    });
    const cfg = await voucherTypeService.getConfig(created.voucherType.vt_id);
    expect(cfg.config.restart_numbering).toEqual([]);
    expect(cfg.config.prefix_details).toEqual([]);
    expect(cfg.config.suffix_details).toEqual([]);
  });
});
