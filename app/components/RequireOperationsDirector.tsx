"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmployeeSession, getEmployee, getToken, routeForRole } from "@/lib/auth-client";

type OpsSession = EmployeeSession & {
  departmentType?: "DAF" | "DSI" | "OPERATIONS" | "OTHERS" | string | null;
};

export default function RequireOperationsDirector({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const emp = getEmployee() as OpsSession | null;

    if (!token || !emp) {
      router.replace("/login");
      return;
    }

    if (emp.status !== "ACTIVE") {
      router.replace("/login");
      return;
    }

    if (emp.role !== "DEPT_HEAD" && emp.role !== "SERVICE_HEAD") {
      router.replace(routeForRole(emp.role, emp.isDsiAdmin, emp.departmentType ?? null));
      return;
    }

    if (emp.isDsiAdmin) {
      router.replace("/dashboard/dsi");
      return;
    }

    if (emp.departmentType && emp.departmentType !== "OPERATIONS") {
      router.replace(routeForRole(emp.role, emp.isDsiAdmin, emp.departmentType ?? null));
      return;
    }
  }, [router]);

  return <>{children}</>;
}
