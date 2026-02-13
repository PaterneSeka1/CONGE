"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getEmployee,
  getToken,
  hasRequiredProfileData,
  routeForRole,
} from "@/lib/auth-client";

export default function RequireManagerDeptHead({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

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

    if (!hasRequiredProfileData(emp) && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }
  }, [pathname, router]);

  return <>{children}</>;
}
