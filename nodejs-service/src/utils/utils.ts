export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  const [day, month, year] = dateStr.split("/");
  if (!day || !month || !year) return false;
  const isoStr = `${year}-${month}-${day}`;
  const date = new Date(isoStr);
  return date instanceof Date && !isNaN(date.getTime());
}

export function convertToISODate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/");
  return new Date(`${year}-${month}-${day}`);
}
