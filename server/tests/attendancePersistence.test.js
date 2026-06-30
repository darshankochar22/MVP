// Round-trip test for the Attendance voucher: create with employee + attendance
// type + value entries, read it back, and confirm the entries persisted joined to
// the employee name/number and attendance type name (the shape the voucher view uses).

const { setupTestDB, createTestCompany } = require("./helpers");
const attendanceService = require("../attendance/attendanceService");
const attendanceTypeService = require("../attendanceType/attendanceTypeService");
const employeeService = require("../employee/employeeService");

describe("Attendance voucher persistence", () => {
  let companyId, empId, presentTypeId, voucherId;

  beforeAll(async () => {
    await setupTestDB();
    const company = await createTestCompany("Attendance Co");
    companyId = company.company_id;

    const emp = await employeeService.create({
      company_id: companyId, name: "Amit Kumar", employee_code: "1001", designation: "Telecalling",
    });
    empId = emp.employee?.employee_id ?? emp.employeeId ?? emp.id;

    // Attendance types are seeded on company creation — pick "Present".
    const typesRes = await attendanceTypeService.getAll(companyId);
    expect(typesRes.success).toBe(true);
    const present = typesRes.attendanceTypes.find((t) => t.name === "Present");
    expect(present).toBeTruthy();
    presentTypeId = present.attendance_type_id;

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
});
