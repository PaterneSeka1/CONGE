"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeHistory() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/employee/requests");
  }, [router]);

  return (
    <div className="p-6">
      <div className="text-sm text-vdm-gold-700">
        Cette page a été fusionnée avec "Mes demandes". Redirection en cours...
      </div>
    </div>
  );
}
