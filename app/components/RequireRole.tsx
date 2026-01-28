"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type EmployeeRole = "CEO" | "ACCOUNTANT" | "DEPT_HEAD" | "EMPLOYEE";
type EmployeeStatus = "PENDING" | "ACTIVE" | "REJECTED";

type EmployeeSession = {
  id: string;
  role: EmployeeRole;
  status: EmployeeStatus;
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

export default function RequireRole({
  allow,
  children,
}: {
  allow: EmployeeRole[];
  children: React.ReactNode;
}) {
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

    if (!allow.includes(emp.role)) {
      router.replace(routeForRole(emp.role));
      return;
    }
  }, [allow, router]);

  return <>{children}</>;
}
