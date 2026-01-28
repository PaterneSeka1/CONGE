export type EmployeeRole = "CEO" | "ACCOUNTANT" | "DEPT_HEAD" | "EMPLOYEE";
export type EmployeeStatus = "PENDING" | "ACTIVE" | "REJECTED";

export type EmployeeSession = {
  id: string;
  email: string;
  matricule?: string | null;
  firstName: string;
  lastName: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  departmentId?: string | null;
  serviceId?: string | null;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getEmployee(): EmployeeSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("employee");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EmployeeSession;
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("employee");
}

export function routeForRole(role: EmployeeRole) {
  switch (role) {
    case "CEO":
      return "/dashboard/ceo";
    case "ACCOUNTANT":
      return "/dashboard/accountant";
    case "DEPT_HEAD":
      return "/dashboard/manager";
    default:
      return "/dashboard/employee";
  }
}
