import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PdfExportWarning } from "../../components/PdfExportWarning";
import { SavedSchedulesPanel } from "../../components/SavedSchedules";
import { initialScheduleFor, STORES } from "../stores";
import { timesheetFingerprint, staleExports } from "../timesheetExport";
import { datesOfMonth } from "../demand";
import { listSavedMonths, switchMonth } from "../monthArchive";
import type { UseScheduleReturn } from "../../hooks/useSchedule";
const base = () => {
 const s=initialScheduleFor(STORES[0]);
 s.shifts=[{id:"s1",employeeId:s.employees[0].id,date:"2026-10-05",startMinutes:600,endMinutes:840,paidMinutes:240,pauseMinutes:0,shiftType:"EARLY" as const,generated:true}];
 s.pdfExports=[{kind:"timesheet",from:"2026-10-01",to:"2026-10-31",exportedAt:"2026-11-05T12:00:00Z",fingerprint:timesheetFingerprint(s,s.employees,datesOfMonth(2026,10))}];
 return s;
};
it("warns with store, month and full affected period after employee or contract changes, persists on reload",()=>{
 const s=base(); expect(staleExports(s)).toEqual([]);
 s.employees=s.employees.map((e,i)=>i===0?{...e,name:"Changed",targetMinutes:1800}:e);
 const html=renderToStaticMarkup(PdfExportWarning({schedule:s}));
 expect(html).toContain("Kichi Vietnamese Foodtour"); expect(html).toContain("10/2026");
 expect(html).toContain("01/10/2026 – 31/10/2026"); expect(html).toContain("Cần xuất lại PDF");
 expect(staleExports(JSON.parse(JSON.stringify(s)))).toHaveLength(1);
 s.pdfExports!.push({...s.pdfExports![0],fingerprint:timesheetFingerprint(s,s.employees,datesOfMonth(2026,10))});
 expect(staleExports(s)).toEqual([]);
});
it("warns for shifts and time off; preserves archive export history",()=>{
 for(const change of ["shift","leave","hours"]){const s=base(); if(change==="shift")s.shifts[0].endMinutes+=30; if(change==="leave")s.employees[0].unavailableRanges=[{startDate:"2026-10-05",endDate:"2026-10-07"}];if(change==="hours")s.workHours.perWeekday.monday=[{startMinutes:660,endMinutes:1200}];expect(staleExports(s)).toHaveLength(1);}
 const s=base(); const next=switchMonth(s,s.shifts,2026,11,"2026-11-05T12:00:00Z").schedule;
 const back=switchMonth(next,[],2026,10).schedule; expect(staleExports(back)).toEqual([]); expect(back.shifts).toEqual(s.shifts);
 const html=renderToStaticMarkup(SavedSchedulesPanel({store:{schedule:next,savedMonths:listSavedMonths(next),storeConfig:STORES[0]} as UseScheduleReturn,openMonth:()=>{},onClose:()=>{}}));
 expect(html).toContain("01/10/2026 – 31/10/2026"); expect(html).toContain("1 ca");expect(html).toContain("05/11/2026"); expect(html).toContain("Đã xuất chấm công");
});
