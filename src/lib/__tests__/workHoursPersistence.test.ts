import { expect, it, vi } from "vitest";
import { initialScheduleFor, STORES } from "../stores";
import { applyMigrations } from "../migrations";
import { normalizeWorkHours } from "../workHours";
import { loadState, saveState } from "../storage";

it("keeps edited hours and closed days through save, reload and repeated migrations", () => {
  const memory = new Map<string,string>();
  vi.stubGlobal("localStorage", { getItem: (key:string) => memory.get(key) ?? null, setItem: (key:string,value:string) => memory.set(key,value) });
  try {
    const base = applyMigrations("kichi", initialScheduleFor(STORES[0]));
    base.workHours.perWeekday.monday = [{ startMinutes: 600, endMinutes: 1140 }];
    base.workHours.perWeekday.tuesday = [];
    base.workHours.holiday = [];
    base.workHours.closedWeekdays.wednesday = true;
    saveState("kichi", { schedule: base, originalShifts: [] });
    for (let i=0;i<3;i++) {
      const loaded = loadState("kichi")!;
      loaded.schedule = applyMigrations("kichi", { ...loaded.schedule, workHours: normalizeWorkHours(loaded.schedule.workHours) });
      expect(loaded.schedule.workHours).toEqual(base.workHours);
      saveState("kichi", loaded);
    }
  } finally { vi.unstubAllGlobals(); }
});
