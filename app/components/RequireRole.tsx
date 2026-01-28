"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmployeeRole, getEmployee, getToken, routeForRole } from "@/lib/auth-client";

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
      router.replace(routeForRole(emp.role, emp.isDsiAdmin));
      return;
    }
  }, [allow, router]);

  return <>{children}</>;
}
