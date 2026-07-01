// Old pre-seeded attendance types (Present/Absent/…) linger in companies made before
// seeding was removed. They must not block the user from creating their own type of
// the same name, nor clutter the list. Two mechanisms cover this:
//   1) attendanceTypeService.create() retires a same-named predefined row on the fly
//      (works immediately, no restart), then creates the user's own.
//   2) attendanceType.init() retires ALL leftover predefined rows on app startup.

const { setupTestDB, createTestCompany, db } = require("./helpers");
const { sql } = require("drizzle-orm");
const attendanceTypeService = require("../attendanceType/attendanceTypeService");

describe("Attendance type: retire pre-seeded defaults", () => {
  let companyId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Att Type Cleanup Co");
    companyId = company.company_id;
    // Simulate an older company that still carries the pre-seeded predefined types.
    await attendanceTypeService.seedDefaultAttendanceTypes(companyId);
  });

  it("creating a same-named type retires the predefined one and succeeds (no restart)", async () => {
    const before = await attendanceTypeService.getAll(companyId);
    const predef = before.attendanceTypes.find((t) => t.name === "Present");
    expect(predef).toBeTruthy();
    expect(Number(predef.is_predefined)).toBe(1);

    // No longer "already exists" — it retires the predefined row and creates the user's.
    const res = await attendanceTypeService.create({ company_id: companyId, name: "Present", type: "Attendance" });
    expect(res.success).toBe(true);
    expect(Number(res.attendanceType.is_predefined)).toBe(0);

    const after = await attendanceTypeService.getAll(companyId);
    const actives = after.attendanceTypes.filter((t) => t.name === "Present");
    expect(actives.length).toBe(1);
    expect(Number(actives[0].is_predefined)).toBe(0);
  });

  it("startup init cleanup retires all remaining predefined types", async () => {
    // Mirrors the idempotent cleanup run by attendanceType.init() on app startup.
    await db.run(sql`UPDATE attendance_types SET is_active = 0 WHERE is_predefined = 1 AND is_active = 1 AND company_id = ${companyId}`);
    const listed = await attendanceTypeService.getAll(companyId);
    expect(listed.attendanceTypes.some((t) => Number(t.is_predefined) === 1)).toBe(false);
  });
});
