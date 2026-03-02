import type { EmployeeSession } from "@/lib/auth-client";

export function getEntryDate(employee?: EmployeeSession | null): Date | null {
  const value = employee?.companyEntryDate ?? employee?.hireDate ?? null;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function isEntryYearCurrent(employee?: EmployeeSession | null, referenceDate = new Date()): boolean {
  const entryDate = getEntryDate(employee);
  if (!entryDate) return false;
  return entryDate.getUTCFullYear() === referenceDate.getUTCFullYear();
}
