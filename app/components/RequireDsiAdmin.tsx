"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type EmployeeRole = "CEO" | "ACCOUNTANT" | "DEPT_HEAD" | "EMPLOYEE";
type EmployeeStatus = "PENDING" | "ACTIVE" | "REJECTED";

type EmployeeSession = {
  id: string;
  role: EmployeeRole;
  status: EmployeeStatus;

  // recommandé: stocker ça au login
  departmentType?: "DAF" | "DSI" | "OPERATIONS" | "OTHERS" | string;
};

function getToken() {
  return typeof window === "undefined" ? null : localStorage.getItem("token");
}

function getEmployee(): EmployeeSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("employee");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EmployeeSession;
  } catch {
    return null;
  }
}

function routeForRole(role: EmployeeRole) {
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

export default function RequireDsiAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const emp = getEmployee();

    if (!token || !emp) {
      router.replace("/login");
      return;
    }

    if (emp.status !== "ACTIVE") {
      router.replace("/login");
      return;
    }

    if (emp.role !== "DEPT_HEAD") {
      router.replace(routeForRole(emp.role));
      return;
    }

    // Check DSI: strict si tu veux. En dev, tu peux tolérer si departmentType manquant.
    if (emp.departmentType && emp.departmentType !== "DSI") {
      router.replace("/dashboard/manager");
      return;
    }
  }, [router]);

  return <>{children}</>;
}
