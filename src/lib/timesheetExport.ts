import type { Employee, Schedule } from "../types";
import { datesOfMonth } from "./demand";

/** Snapshot of all inputs relevant to the exported period, excluding export metadata. */
export function timesheetFingerprint(schedule: Schedule, employees: readonly Employee[], dates?: readonly string[]): string {
  const period = dates ? new Set(dates) : null;
  return JSON.stringify([schedule.year, schedule.month, schedule.companyName, schedule.address,
    schedule.workHours, schedule.dateOverrides.filter(o => !period || period.has(o.date)),
    employees, schedule.shifts.filter(s => !period || period.has(s.date)).sort((a,b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))]);
}
export function staleExports(schedule: Schedule, _fingerprint?: string) {
  const month = `${schedule.year}-${String(schedule.month).padStart(2,"0")}`;
  const latest = new Map<string, NonNullable<Schedule["pdfExports"]>[number]>();
  for (const e of schedule.pdfExports ?? []) if(e.from.startsWith(month)) latest.set(`${e.kind}:${e.from}:${e.to}`,e);
  const dates = datesOfMonth(schedule.year, schedule.month);
  const entries = [...latest.values()];
  const matches = (e: typeof entries[number]) => e.fingerprint === timesheetFingerprint(schedule, schedule.employees, dates.filter(d => d >= e.from && d <= e.to));
  return entries.filter(e => e.fingerprint != null && !matches(e) && !entries.some(n => n.kind === e.kind && matches(n) && n.from <= e.from && n.to >= e.to));
}
