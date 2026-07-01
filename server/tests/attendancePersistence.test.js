// Round-trip test for the Attendance voucher: create with employee + attendance
// type + value entries, read it back, and confirm the entries persisted joined to
// the employee name/number and attendance type name (the shape the voucher view uses).

const { setupTestDB, createTestCompany } = require("./helpers");
const attendanceService = require("../attendance/attendanceService");
const attendanceTypeService = require("../attendanceType/attendanceTypeService");
const employeeService = require("../employee/employeeService");
const employeeGroupService = require("../employeeGroup/employeeGroupService");

describe("Attendance voucher persistence", () => {
  let companyId, empId, primaryGroupId, voucherId, presentTypeId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Attendance Co");
    companyId = company.company_id;

    // Place the employee in a group so the List of Employees join can show it.
    const groups = await employeeGroupService.getAll(companyId);
    primaryGroupId = groups.employeeGroups.find((g) => g.name === "Primary")?.employee_group_id ?? null;

    const emp = await employeeService.create({
      company_id: companyId, name: "Amit Kumar", employee_code: "1001",
      designation: "Telecalling", employee_group_id: primaryGroupId,
    });
    empId = emp.employee?.employee_id ?? emp.employeeId ?? emp.id;

    // Attendance types are user-created (no longer auto-seeded) — create "Present".
    const typeRes = await attendanceTypeService.create({
      company_id: companyId, name: "Present", type: "Attendance",
    });
    expect(typeRes.success).toBe(true);
    presentTypeId = typeRes.attendanceType.attendance_type_id;

    const res = await attendanceService.create({
      company_id: companyId,
      date: "2026-04-01",
      narration: "April attendance",
      entries: [{ employee_id: empId, attendance_type_id: presentTypeId, value: 27 }],
    });
    expect(res.success).toBe(true);
    voucherId = res.attendance_voucher_id;
  });

  it("persists the attendance entry with employee + type + value", async () => {
    const res = await attendanceService.getById(voucherId);
    expect(res.success).toBe(true);
    expect(res.voucher.narration).toBe("April attendance");
    expect(res.voucher.entries.length).toBe(1);

    const e = res.voucher.entries[0];
    expect(e.employee_name).toBe("Amit Kumar");
    expect(e.employee_number).toBe("1001");
    expect(e.attendance_type_name).toBe("Present");
    expect(Number(e.value)).toBe(27);
  });

  it("does NOT auto-generate an employee code when left blank", async () => {
    const res = await employeeService.create({ company_id: companyId, name: "No Code Emp" });
    expect(res.success).toBe(true);
    // Blank in — blank out (no "EMP-00001" assigned by the app).
    expect(res.employee.employee_code == null || res.employee.employee_code === "").toBe(true);

    const back = await employeeService.getById(res.employee.employee_id);
    expect(back.employee.employee_code == null || back.employee.employee_code === "").toBe(true);
  });

  it("employee.getAll joins the group name (for the List of Employees popup)", async () => {
    const all = await employeeService.getAll(companyId);
    expect(all.success).toBe(true);
    const row = all.employees.find((r) => r.employee_id === empId);
    expect(row).toBeTruthy();
    expect(row.employee_code).toBe("1001");
    if (primaryGroupId) expect(row.group_name).toBe("Primary");
    // category_name is null here (no category assigned) but the column key exists.
    expect("category_name" in row).toBe(true);
  });
});
