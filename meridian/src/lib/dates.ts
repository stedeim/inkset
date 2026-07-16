/** Start of the given day (local server time), used to bucket plan items and check-ins by date. */
export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

/** Midnight N days before the given day. */
export function daysAgo(d: Date, n: number): Date {
  const copy = startOfDay(d);
  copy.setDate(copy.getDate() - n);
  return copy;
}

/** YYYY-MM-DD label. */
export function isoDate(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}
