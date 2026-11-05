import type { Schedule } from "../types";
import { staleExports } from "../lib/timesheetExport";
import { dateRangeLabel } from "../lib/dateLabel";

export function PdfExportWarning({ schedule }: { schedule: Schedule }) {
  const months = [schedule, ...Object.entries(schedule.archive ?? {}).map(([key, archive]) => ({ ...schedule, ...archive, employees: schedule.employees, year: Number(key.slice(0,4)), month: Number(key.slice(5,7)) }))];
  const warnings = months.flatMap(s => staleExports(s).map(e => ({ ...e, year: s.year, month: s.month })));
  if (!warnings.length) return null;
  return <section role="alert" className="no-print mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-950">
    <strong>Cần xuất lại PDF · {schedule.companyName}</strong>
    <p>Dữ liệu ảnh hưởng bảng chấm công đã thay đổi. Xuất PDF mới để thay thế bản cũ cho các kỳ sau:</p>
    <ul className="list-disc pl-5">{warnings.map(e => <li key={`${e.kind}-${e.from}-${e.to}`}>Tháng {e.month}/{e.year} · {dateRangeLabel([e.from,e.to])} · {e.kind === "timesheet" ? "Bảng chấm công" : "Lịch làm việc"}</li>)}</ul>
  </section>;
}
