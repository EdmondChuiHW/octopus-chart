export function isoOffsetHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function formatTimeLocal(date: Date | string) {
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString("en-US", {
      timeZone: "Europe/London",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(date);
  }
}

export function getLocalDateKey(date: Date | string) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
  });
}
