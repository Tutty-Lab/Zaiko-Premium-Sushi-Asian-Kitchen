import type { Schedule } from "../types";
export function applyMigrations(storeId: string, schedule: Schedule): Schedule {
  const id = "2026-11-zaiko-coverage-groups";
  if (storeId !== "zaiko" || schedule.migrations?.includes(id)) return schedule;
  return {...schedule, employees: schedule.employees.map(employee => ({...employee,
    station: employee.ownerSupport ? "BOTH" : employee.role === "Phục Vụ" || employee.role === "Bar" ? "SERVICE" : employee.role === "Sushi" || employee.role === "Bếp" ? "KITCHEN" : employee.station,
  })), migrations: [...(schedule.migrations ?? []), id]};
}
