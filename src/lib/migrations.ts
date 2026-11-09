import type { Schedule } from "../types";
import { barPeakWindows, zaikoEmployees } from "./restaurantData";

/**
 * Saving the employee form used to freeze a weekly contract into that month's
 * figure. Such a figure is off the 30-minute grid; a typed monthly quota is kept.
 */
function restoreFrozenWeeklyContracts(schedule: Schedule): Schedule {
  const id = "2026-11-zaiko-restore-weekly-contracts";
  if (schedule.migrations?.includes(id)) return schedule;
  const seeded = new Map(zaikoEmployees().map(employee => [employee.id, employee.weeklyHours]));
  return { ...schedule, employees: schedule.employees.map(employee =>
    employee.weeklyHours == null && employee.targetMinutes % 30 !== 0 && seeded.has(employee.id)
      ? { ...employee, weeklyHours: seeded.get(employee.id) }
      : employee,
  ), migrations: [...(schedule.migrations ?? []), id] };
}

export function applyMigrations(storeId: string, schedule: Schedule): Schedule {
  if (storeId !== "zaiko") return schedule;
  return restoreFrozenWeeklyContracts(applyCoverageMigrations(schedule));
}

function applyCoverageMigrations(schedule: Schedule): Schedule {
  const id = "2026-11-zaiko-coverage-groups";
  if (!schedule.migrations?.includes(id)) {
  schedule = {...schedule, employees: schedule.employees.map(employee => ({...employee,
    station: employee.ownerSupport ? "BOTH" : employee.role === "Phục Vụ" || employee.role === "Bar" ? "SERVICE" : employee.role === "Sushi" || employee.role === "Bếp" ? "KITCHEN" : employee.station,
  })), migrations: [...(schedule.migrations ?? []), id]};
  }
  const barId = "2026-11-zaiko-bar-short-peak-shifts";
  if (schedule.migrations?.includes(barId)) return schedule;
  return { ...schedule, employees: schedule.employees.map(employee => {
    if (employee.role !== "Bar" || employee.weeklyHours !== 9) return employee;
    const range = employee.shiftHours;
    return { ...employee,
      ...(!range || (range.min === 3 && range.max === 6) ? { shiftHours: { min: 2, max: 3 } } : {}),
      ...(!employee.preferredWindows?.length ? { preferredWindows: barPeakWindows() } : {}),
    };
  }), migrations: [...(schedule.migrations ?? []), barId] };
}
