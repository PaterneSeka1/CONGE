"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEmployee, getToken, routeForRole } from "@/lib/auth-client";

export default function RequireManagerDeptHead({ children }: { children: React.ReactNode }) {
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

    if (emp.role !== "DEPT_HEAD" && emp.role !== "SERVICE_HEAD") {
      router.replace(routeForRole(emp.role, emp.isDsiAdmin, emp.departmentType ?? null));
      return;
    }

    if (emp.isDsiAdmin) {
      router.replace("/dashboard/dsi");
      return;
    }
  }, [router]);

  return <>{children}</>;
}
