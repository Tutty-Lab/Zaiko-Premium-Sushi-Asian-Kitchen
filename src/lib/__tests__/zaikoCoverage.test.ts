import { describe, expect, it } from "vitest";
import { staffAt } from "../staffing";
import { zaikoEmployees, restaurantOwner } from "../restaurantData";
import { applyMigrations } from "../migrations";
import { initialScheduleFor, STORES } from "../stores";
describe("Zaiko coverage groups", () => {
 it("groups all ten employees by their supplied position", () => {
  const employees = zaikoEmployees();
  expect(employees.filter(e => e.station === "SERVICE")).toHaveLength(5);
  expect(employees.filter(e => e.station === "KITCHEN")).toHaveLength(5);
 });
 it("owner presence does not contribute to staffing coverage", () => {
  const employees = new Map([...zaikoEmployees(), restaurantOwner()].map(e => [e.id, e]));
  expect(staffAt([], employees, 1080)).toEqual([]);
 });
 it("migrates saved flexible staff without changing contracts", () => {
  const schedule = initialScheduleFor(STORES[0]);
  schedule.employees = schedule.employees.map(e => ({...e, station: "BOTH"}));
  const next = applyMigrations("zaiko", schedule);
  expect(next.employees.filter(e => e.station === "SERVICE")).toHaveLength(5);
  expect(next.employees.filter(e => e.station === "KITCHEN")).toHaveLength(5);
  expect(next.employees.map(e => e.weeklyHours)).toEqual(schedule.employees.map(e => e.weeklyHours));
 });
});
