import { describe, expect, it } from "vitest";
import { generateWeeklySchedule } from "../weeklyScheduler";
import { initialScheduleFor, STORES } from "../stores";
import { applyMigrations } from "../migrations";
import { datesOfMonth } from "../demand";
import { publicHolidays } from "../holidays";
import { resolveDay } from "../workHours";
import { workingAt } from "../staffing";
import { weekStartOf } from "../weeks";
import { monthlyTargetMinutesFor, weeklyBudgetMinutes } from "../contract";
import { draftFrom, draftToEmployee } from "../../components/EmployeesTab";

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

  it("keeps a weekly contract when only the start date is edited in the form", () => {
    const employee = STORES[0].sampleEmployees()[0];
    const draft = { ...draftFrom(employee, {}, 10057), startDate: "2026-11-20" };
    expect(draftToEmployee(draft)).toMatchObject({ weeklyHours: 39, startDate: "2026-11-20" });
    expect(draftToEmployee({ ...draft, hours: "100" }).weeklyHours).toBeUndefined();
  });

  it("restores weekly contracts frozen by the old form and leaves typed quotas alone", () => {
    const schedule = initialScheduleFor(STORES[0]);
    schedule.employees[0] = { ...schedule.employees[0], weeklyHours: undefined, targetMinutes: 10057, startDate: "2026-11-20" };
    schedule.employees[1] = { ...schedule.employees[1], weeklyHours: undefined, targetMinutes: 3000 };
    const next = applyMigrations("zaiko", schedule);
    expect(next.employees[0].weeklyHours).toBe(39);
    expect(next.employees[1].weeklyHours).toBeUndefined();
    expect(applyMigrations("zaiko", next)).toBe(next);
  });

  it("caps a monthly quota at what the remaining days allow and stays within 8 h a day", () => {
    const store = STORES[0], schedule = initialScheduleFor(store);
    schedule.employees[0] = { ...schedule.employees[0], weeklyHours: undefined, targetMinutes: 10080, startDate: "2026-11-20" };
    const holidays = publicHolidays(schedule.year);
    const open = datesOfMonth(schedule.year, schedule.month).filter(date => !resolveDay(store.workHours!, date, holidays).closed);
    expect(monthlyTargetMinutesFor(schedule.employees[0], open, store.workHours!)).toBe(open.filter(date => date >= "2026-11-20").length * 480);
    const shifts = generateWeeklySchedule({ ...schedule, workHours: store.workHours!, rules: store.staffingRules, weights: store.dayWeights, demandProfile: store.demandProfile, storeTag: store.id });
    const perDay = new Map<string, number>();
    for (const shift of shifts) perDay.set(shift.employeeId + shift.date, (perDay.get(shift.employeeId + shift.date) ?? 0) + shift.paidMinutes);
    expect(Math.max(...perDay.values())).toBeLessThanOrEqual(480);
  }, 30000);

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
    // A split day may only bridge the 16–17 closure: no extra waiting, no one-hour stubs.
    const idle: string[] = [];
    for (const employee of schedule.employees) for (const date of open) {
      const own = shifts.filter(s => s.employeeId === employee.id && s.date === date).sort((a, b) => a.startMinutes - b.startMinutes);
      if (own.length < 2) continue;
      const [early, late] = own;
      if (own.length > 2 || early.endMinutes !== 960 || late.startMinutes !== 1020 || early.paidMinutes < 120 || late.paidMinutes < 120) {
        idle.push(`${employee.name} ${date}: ${own.map(s => `${s.startMinutes / 60}-${s.endMinutes / 60}`).join(" + ")}`);
      }
    }
    expect(idle).toEqual([]);
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
