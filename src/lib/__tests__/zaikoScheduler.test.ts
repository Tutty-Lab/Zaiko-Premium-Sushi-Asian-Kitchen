import { describe, expect, it } from "vitest";
import { generateWeeklySchedule } from "../weeklyScheduler";
import { initialScheduleFor, STORES } from "../stores";
import { applyMigrations } from "../migrations";
import { datesOfMonth } from "../demand";
import { publicHolidays } from "../holidays";
import { resolveDay } from "../workHours";
import { workingAt } from "../staffing";
import { weekStartOf } from "../weeks";
import { weeklyBudgetMinutes } from "../contract";

describe("Zaiko schedule performance and short Bar shifts", () => {
  it("migrates old Bar defaults once, preserving contracts and custom preferences", () => {
    const schedule = initialScheduleFor(STORES[0]);
    schedule.employees = schedule.employees.map(e => ({ ...e, shiftHours: { min: 3, max: 6 }, preferredWindows: undefined }));
    const next = applyMigrations("zaiko", schedule);
    expect(next.employees.find(e => e.id === "zaiko-08")?.shiftHours).toEqual({ min: 2, max: 3 });
    expect(next.employees.find(e => e.id === "zaiko-05")?.weeklyHours).toBe(17);
    expect(applyMigrations("zaiko", next)).toBe(next);
    schedule.employees[7].shiftHours = { min: 2.5, max: 3 };
    schedule.employees[7].preferredWindows = [{ days: ["friday"], startMinutes: 1080, endMinutes: 1200 }];
    expect(applyMigrations("zaiko", schedule).employees[7]).toMatchObject(schedule.employees[7]);
  });

  it("generates a full month within 20 seconds with group coverage and weekly budgets", () => {
    const store = STORES[0], schedule = initialScheduleFor(store);
    const start = performance.now();
    const shifts = generateWeeklySchedule({ ...schedule, workHours: store.workHours!, rules: store.staffingRules, weights: store.dayWeights, demandProfile: store.demandProfile, storeTag: store.id });
    expect(performance.now() - start).toBeLessThan(20000);
    const holidays = publicHolidays(schedule.year);
    const dates = datesOfMonth(schedule.year, schedule.month);
    const open = dates.filter(date => !resolveDay(store.workHours!, date, holidays).closed);
    for (const date of open) for (const block of resolveDay(store.workHours!, date, holidays).blocks) {
      for (let minute = block.startMinutes; minute < block.endMinutes; minute += 30) {
        for (const station of ["SERVICE", "KITCHEN"]) expect(shifts.some(s => s.date === date && workingAt(s, minute) && schedule.employees.find(e => e.id === s.employeeId)?.station === station), `${date} ${minute} ${station}`).toBe(true);
      }
    }
    expect(shifts.some(s => s.employeeId === "zaiko-owner")).toBe(false);
    for (const employee of schedule.employees.filter(e => !e.ownerSupport)) {
      const budgets = weeklyBudgetMinutes(employee, open, { first: dates[0], last: dates.at(-1)! }, store.workHours!);
      for (const [week, budget] of budgets) {
        const own = shifts.filter(s => s.employeeId === employee.id && weekStartOf(s.date) === week);
        expect(own.reduce((sum, s) => sum + s.paidMinutes, 0), `${employee.id} ${week}`).toBe(budget);
        if (employee.role === "Bar" && employee.weeklyHours === 9 && budget === 540) {
          for (const shift of own) {
            expect(shift.paidMinutes).toBeGreaterThanOrEqual(120);
            expect(shift.paidMinutes).toBeLessThanOrEqual(180);
            expect(shift.startMinutes).toBeLessThan(1200);
            expect(shift.endMinutes).toBeGreaterThan(1080);
          }
        }
      }
    }
  }, 30000);
});
