import type { Schedule } from "../types";
import { barPeakWindows } from "./restaurantData";
export function applyMigrations(storeId: string, schedule: Schedule): Schedule {
  const id = "2026-11-zaiko-coverage-groups";
  if (storeId !== "zaiko") return schedule;
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
