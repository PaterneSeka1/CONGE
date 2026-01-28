"use client";

import { useRouter } from "next/navigation";
import { getEmployee, logout } from "@/lib/auth-client";

export default function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const employee = getEmployee();

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm text-gray-600">
              {employee ? `${employee.firstName} ${employee.lastName} — ${employee.role}` : ""}
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-3 py-2 rounded-md border bg-white hover:bg-gray-100 text-sm"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
