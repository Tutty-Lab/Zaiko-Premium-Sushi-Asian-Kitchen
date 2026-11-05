import { expect, it } from "vitest";
import { dateRangeLabel } from "../dateLabel";
import { datesOfMonth } from "../demand";
import { weeksOfMonth } from "../weeks";
import { switchMonth } from "../monthArchive";
import { initialScheduleFor, STORES } from "../stores";
import { draftFrom, draftToEmployee } from "../../components/EmployeesTab";

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

it("remembers the selected salary input without losing the other salary value", () => {
  const draft = draftFrom(initialScheduleFor(STORES[0]).employees[0]);
  draft.salaryInput = "hourly";
  draft.hourlyRate = "15,50";
  const employee = {id:"test", ...draftToEmployee(draft)};
  expect(draftFrom(employee).salaryInput).toBe("hourly");
  expect(employee.monthlySalary).toBe(470);
  expect(employee.hourlyRate).toBe(15.5);
});
