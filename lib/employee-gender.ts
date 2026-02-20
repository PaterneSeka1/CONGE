export const EMPLOYEE_GENDERS = ["FEMALE", "MALE", "OTHER"] as const;
export type EmployeeGender = (typeof EMPLOYEE_GENDERS)[number];

export const EMPLOYEE_GENDER_LABELS: Record<EmployeeGender, string> = {
  FEMALE: "Femme",
  MALE: "Homme",
  OTHER: "Autre / Préfère ne pas dire",
};

export function isEmployeeGender(value: unknown): value is EmployeeGender {
  return (
    typeof value === "string" &&
    EMPLOYEE_GENDERS.includes(value as EmployeeGender)
  );
}
