import { expect, it } from "vitest";
import { STORES, initialScheduleFor } from "../stores";
import { publicHolidays } from "../holidays";
import { normalizeWorkHours, resolveDay } from "../workHours";
import { generateSchedule } from "../scheduler";
import { staffAt } from "../staffing";
import { datesOfMonth } from "../demand";

it("uses Hamburg holidays, preserves closed Sundays and holidays after normalization", () => {
  const h = publicHolidays(2026), work = normalizeWorkHours(STORES[0].workHours);
  expect(h.has("2026-10-31")).toBe(true);
  for (const date of ["2026-01-06", "2026-06-04", "2026-08-15", "2026-11-01"]) expect(h.has(date)).toBe(false);
  expect(resolveDay(work, "2026-10-31", h).closed).toBe(true);
  expect(resolveDay(work, "2026-10-04", h).closed).toBe(true);
  expect(resolveDay(work, "2026-10-05", h).window).toEqual({startMinutes:600,endMinutes:1200});
});
it("seeds only five paid part-time employees plus the owner", () => {
  const e=STORES[0].sampleEmployees();
  expect(e.filter(x=>!x.ownerSupport)).toHaveLength(5);
  expect(e.reduce((n,x)=>n+(x.monthlySalary??0),0)).toBe(3270);
  expect(e.filter(x=>!x.ownerSupport).every(x=>x.employmentType==="TEILZEIT")).toBe(true);
  expect(e.find(x=>x.id==="kc-9")?.role).toBe("Kasse");
});
it("schedules within opening hours, counts owner once, covers every lunch with two people", () => {
  const store=STORES[0], base=initialScheduleFor(store), h=publicHolidays(2026);
  const shifts=generateSchedule({...base,rules:store.staffingRules,weights:store.dayWeights,demandProfile:store.demandProfile,storeTag:store.id});
  expect(shifts.length).toBeGreaterThan(0);
  const people=new Map(base.employees.map(e=>[e.id,e]));
  for(const s of shifts){
    expect(resolveDay(base.workHours,s.date,h).closed).toBe(false);
    expect(s.startMinutes).toBeGreaterThanOrEqual(600);
    expect(s.endMinutes).toBeLessThanOrEqual(1200);
    expect(people.get(s.employeeId)?.ownerSupport).not.toBe(true);
  }
  for(const date of datesOfMonth(2026,10)){
    if(resolveDay(base.workHours,date,h).closed) continue;
    const day=shifts.filter(s=>s.date===date);
    for(let m=720;m<840;m+=15){
      const present=staffAt(day,people,m);
      expect(present.length,`${date} ${m}`).toBeGreaterThanOrEqual(2);
      expect(present.filter(e=>e.ownerSupport)).toHaveLength(1);
    }
  }
},60000);


