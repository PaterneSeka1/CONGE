"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEmployee, getToken } from "@/lib/auth-client";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const employee = getEmployee();

    if (!token || !employee) {
      router.replace("/login");
      return;
    }

    // Si compte pas validé => pas d'accès dashboard
    if (employee.status !== "ACTIVE") {
      router.replace("/login");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
