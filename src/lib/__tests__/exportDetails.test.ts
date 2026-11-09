import { describe, expect, it } from "vitest";
import { dateRangeLabel } from "../dateLabel";
import { datesOfMonth } from "../demand";
import { weeksOfMonth } from "../weeks";
import { switchMonth } from "../monthArchive";
import { initialScheduleFor, STORES } from "../stores";
import { restaurantOwner } from "../restaurantData";
import { draftFrom, draftQuotaHours, draftToEmployee } from "../../components/EmployeesTab";

it("labels full and partial weeks with calendar dates including the year", () => {
  expect(dateRangeLabel(datesOfMonth(2028, 2))).toBe("01/02/2028 – 29/02/2028");
  expect(dateRangeLabel(weeksOfMonth(2026, 11)[0].dates)).toBe("01/11/2026 – 01/11/2026");
  expect(dateRangeLabel(weeksOfMonth(2026, 11)[1].dates)).toBe("02/11/2026 – 08/11/2026");
});

it("keeps export history when switching months", () => {
  const base = initialScheduleFor(STORES[0]);
  const entry = {kind: "timesheet" as const, from:"2026-11-02", to:"2026-11-08", exportedAt:"2026-11-05T12:00:00Z"};
  const next = switchMonth({...base, pdfExports:[entry]}, [], 2026, 12).schedule;
  expect(switchMonth(next, [], 2026, 11).schedule.pdfExports).toEqual([entry]);
});

describe("monthly hours in the employee form", () => {
  const base = () => initialScheduleFor(STORES[0]).employees[0];

  it("derives hours from salary and remembers the mode", () => {
    const draft = { ...draftFrom(base()), quotaSource: "salary" as const, monthlySalary: "1700", hourlyRate: "13,60", hours: "999" };
    const employee = { id: "test", ...draftToEmployee(draft) };
    expect(draftQuotaHours(draft)).toBe(125);
    expect(employee.targetMinutes).toBe(7500);
    expect(employee.quotaSource).toBe("salary");
    expect(draftFrom(employee).quotaSource).toBe("salary");
  });

  it("takes typed hours and keeps the salary already entered", () => {
    const start = { ...base(), monthlySalary: 1700, hourlyRate: 13.6, quotaSource: "salary" as const };
    const draft = { ...draftFrom(start), quotaSource: "hours" as const, hours: "80,5" };
    const employee = { id: "test", ...draftToEmployee(draft) };
    expect(employee.targetMinutes).toBe(4830);
    expect(employee.monthlySalary).toBe(1700);
    expect(employee.hourlyRate).toBe(13.6);
    expect(draftFrom(employee).quotaSource).toBe("hours");
  });

  it("rejects inputs that cannot give hours", () => {
    const salary = { ...draftFrom(base()), quotaSource: "salary" as const };
    expect(draftQuotaHours({ ...salary, monthlySalary: "", hourlyRate: "13" })).toBeNull();
    expect(draftQuotaHours({ ...salary, monthlySalary: "1700", hourlyRate: "0" })).toBeNull();
    const hours = { ...draftFrom(base()), quotaSource: "hours" as const };
    expect(draftQuotaHours({ ...hours, hours: "" })).toBeNull();
    expect(draftQuotaHours({ ...hours, hours: "-1" })).toBeNull();
    expect(draftQuotaHours({ ...hours, hours: "abc" })).toBeNull();
  });

  it("opens legacy employees by whether they have a monthly salary", () => {
    const { quotaSource: _ignored, ...legacy } = base();
    expect(draftFrom({ ...legacy, monthlySalary: 1700 }).quotaSource).toBe("salary");
    expect(draftFrom({ ...legacy, monthlySalary: undefined }).quotaSource).toBe("hours");
  });

  it("keeps the owner at zero hours without asking for a salary", () => {
    const draft = { ...draftFrom(restaurantOwner()), monthlySalary: "", hourlyRate: "" };
    expect(draftQuotaHours(draft)).toBe(0);
    expect(draftToEmployee(draft).targetMinutes).toBe(0);
  });
});
