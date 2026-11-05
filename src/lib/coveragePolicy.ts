export const REQUIRED_COVERAGE = [{ startMinutes: 720, endMinutes: 840 }] as const;
export const isRequiredCoverage = (minute: number) => REQUIRED_COVERAGE.some(w => minute >= w.startMinutes && minute < w.endMinutes);
export const coverageBoundaries = (from: number, to: number) => REQUIRED_COVERAGE.flatMap(w => [w.startMinutes, w.endMinutes]).filter(t => t > from && t < to);
export function busyKitchenTarget(_date: string | undefined, _minute: number): number { return 1; }
