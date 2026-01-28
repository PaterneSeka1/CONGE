"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EmployeeSession, getEmployee, getToken, routeForRole } from "@/lib/auth-client";

type DsiSession = EmployeeSession & {
  // recommandé: stocker ça au login
  departmentType?: "DAF" | "DSI" | "OPERATIONS" | "OTHERS" | string;
};

export default function RequireDsiAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const emp = getEmployee() as DsiSession | null;

    if (!token || !emp) {
      router.replace("/login");
      return;
    }

    if (emp.status !== "ACTIVE") {
      router.replace("/login");
      return;
    }

    if (emp.role !== "DEPT_HEAD") {
      router.replace(routeForRole(emp.role, emp.isDsiAdmin));
      return;
    }

    if (emp.isDsiAdmin === false) {
      router.replace("/dashboard/manager");
      return;
    }

    // Check DSI: strict si tu veux. En dev, tu peux tolérer si departmentType manquant.
    if (emp.isDsiAdmin == null && emp.departmentType && emp.departmentType !== "DSI") {
      router.replace("/dashboard/manager");
      return;
    }
  }, [router]);

  return <>{children}</>;
}
