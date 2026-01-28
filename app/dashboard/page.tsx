"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getEmployee, getToken, routeForRole } from "@/lib/auth-client";

export default function DashboardIndex() {
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

    router.replace(routeForRole(emp.role, emp.isDsiAdmin));
  }, [router]);

  return null;
}
