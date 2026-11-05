export function fullDateLabel(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function dateRangeLabel(dates: readonly string[]): string {
  const sorted = [...dates].sort();
  return sorted.length ? `${fullDateLabel(sorted[0])} – ${fullDateLabel(sorted[sorted.length - 1])}` : "";
}
