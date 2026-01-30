"use client";

import { Sidebar } from "../../components/Sidebar";
import { operationsMenu } from "../../components/sidebar-menus-operations";
import RequireManagerDeptHead from "../../components/RequireManagerDeptHead";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireManagerDeptHead>
      <div className="min-h-screen bg-gray-50">
        <Sidebar brandTitle="CONGES" brandSubtitle="Direction des operations" sections={operationsMenu} />
        <div className="lg:pl-64 pt-[72px] lg:pt-0">{children}</div>
      </div>
    </RequireManagerDeptHead>
  );
}
