import type { Schedule } from "../types";
/** Zaiko starts with a clean store-specific schema; legacy Kichi migrations disabled. */
export function applyMigrations(_storeId: string, schedule: Schedule): Schedule { return schedule; }
