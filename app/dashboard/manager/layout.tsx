"use client";

import { Sidebar } from "../../components/Sidebar";
import { managerMenu } from "../../components/sidebar-menus";
import RequireRole from "../../components/RequireRole";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole allow={["DEPT_HEAD"]}>
      <div className="min-h-screen bg-gray-50">
        <Sidebar brandTitle="CONGÉS" brandSubtitle="Espace Responsable" sections={managerMenu} />
        <div className="lg:pl-64 pt-[72px] lg:pt-0">{children}</div>
      </div>
    </RequireRole>
  );
}
