import { expect, it, vi } from "vitest";
import { draftFrom, draftToEmployee } from "../../components/EmployeesTab";
import { initialScheduleFor, STORES } from "../stores";
import { applyMigrations } from "../migrations";
import { saveState, loadState } from "../storage";
it("round-trips all editable employee settings without seed defaults", () => {
 const memory = new Map<string,string>();
 vi.stubGlobal("localStorage", { getItem:(k:string)=>memory.get(k)??null, setItem:(k:string,v:string)=>memory.set(k,v) });
 try {
  const schedule=applyMigrations("kichi",initialScheduleFor(STORES[0]));
  const d=draftFrom(schedule.employees[0]);
  Object.assign(d,{name:"Test",employmentType:"TEILZEIT",station:"BOTH",hours:"30",monthlySalary:"600",hourlyRate:"20",maxDays:"3",daysOff:["monday","sunday"],fixed:true,fixedStart:"09:00",fixedEnd:"13:00",limited:true,windowStart:"08:00",windowEnd:"18:00",holidayDuty:true,shiftMin:"2",shiftMax:"4",spreadEvenly:true,startDate:"2026-10-05",endDate:"2027-03-31",unavailableRanges:[{startDate:"2026-12-01",endDate:"2026-12-10"}],windows:[{days:["tuesday"],start:"12:00",end:"14:00"}]});
  const employee={id:"edited",...draftToEmployee(d)};
  schedule.employees=[employee];
  saveState("kichi",{schedule,originalShifts:[]});
  const reloaded=applyMigrations("kichi",loadState("kichi")!.schedule).employees[0];
  expect(reloaded).toEqual(employee);
  expect(reloaded.targetMinutes).toBe(1800);
  expect(draftToEmployee(draftFrom(reloaded))).toEqual(draftToEmployee(d));
  const cleared=draftFrom(reloaded);
  Object.assign(cleared,{fixed:false,limited:false,daysOff:[],maxDays:"",monthlySalary:"",hourlyRate:"",shiftMin:"",shiftMax:"",windows:[],startDate:"",endDate:"",unavailableRanges:[],holidayDuty:false,spreadEvenly:false});
  const next=draftToEmployee(cleared);
  expect(next.fixedShift).toBeUndefined(); expect(next.shiftWindow).toBeUndefined();
  expect(next.availableWeekdays).toBeUndefined(); expect(next.maxDaysPerWeek).toBeUndefined();
  expect(next.hourlyRate).toBeUndefined(); expect(next.monthlySalary).toBeUndefined();
  expect(next.preferredWindows).toBeUndefined(); expect(next.startDate).toBeUndefined();
 } finally { vi.unstubAllGlobals(); }
});
