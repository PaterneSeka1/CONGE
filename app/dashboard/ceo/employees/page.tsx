"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";

type EmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  matricule?: string | null;
  jobTitle?: string | null;
  role: "CEO" | "ACCOUNTANT" | "DEPT_HEAD" | "EMPLOYEE";
  status: "PENDING" | "ACTIVE" | "REJECTED";
  department?: "DAF" | "DSI" | "OPERATIONS" | "OTHERS";
  service?: "INFORMATION" | "REPUTATION" | null;
};

export default function CeoEmployees() {
  const [rows] = useState<EmployeeRow[]>([
    {
      id: "1",
      firstName: "Awa",
      lastName: "Traoré",
      email: "awa@ex.com",
      matricule: "EMP020",
      jobTitle: "Développeuse",
      role: "EMPLOYEE",
      status: "ACTIVE",
      department: "DSI",
      service: "INFORMATION",
    },
    {
      id: "2",
      firstName: "Mariam",
      lastName: "Kouadio",
      email: "mariam@ex.com",
      matricule: "DAF010",
      jobTitle: "Comptable",
      role: "ACCOUNTANT",
      status: "ACTIVE",
      department: "DAF",
      service: "REPUTATION",
    },
  ]);

  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (departmentFilter !== "ALL" && r.department !== departmentFilter) return false;
      if (roleFilter !== "ALL" && r.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (serviceFilter !== "ALL" && (r.service ?? "NONE") !== serviceFilter) return false;
      return true;
    });
  }, [rows, departmentFilter, roleFilter, statusFilter, serviceFilter]);

  const columns = useMemo<ColumnDef<EmployeeRow>[]>(
    () => [
      {
        id: "employee",
        header: "Employé",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">
              {row.original.firstName} {row.original.lastName}
            </div>
            <div className="text-xs text-vdm-gold-700">{row.original.matricule ?? ""}</div>
          </div>
        ),
      },
      { header: "Email", accessorKey: "email" },
      { header: "Poste", accessorKey: "jobTitle" },
      { header: "Rôle", accessorKey: "role" },
      { header: "Statut", accessorKey: "status" },
      { header: "Département", accessorKey: "department" },
      { header: "Service", accessorKey: "service" },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Tous les employés</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Filtrer par département, rôle, statut ou service.
      </div>

      <div className="grid gap-3 md:grid-cols-4 mb-4">
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full border border-vdm-gold-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
        >
          <option value="ALL">Tous les départements</option>
          <option value="DSI">DSI</option>
          <option value="DAF">DAF</option>
          <option value="OPERATIONS">OPERATIONS</option>
          <option value="OTHERS">OTHERS</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full border border-vdm-gold-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
        >
          <option value="ALL">Tous les rôles</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
          <option value="DEPT_HEAD">DEPT_HEAD</option>
          <option value="ACCOUNTANT">ACCOUNTANT</option>
          <option value="CEO">CEO</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full border border-vdm-gold-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PENDING">PENDING</option>
          <option value="REJECTED">REJECTED</option>
        </select>

        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="w-full border border-vdm-gold-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
        >
          <option value="ALL">Tous les services</option>
          <option value="INFORMATION">INFORMATION</option>
          <option value="REPUTATION">REPUTATION</option>
          <option value="NONE">Aucun</option>
        </select>
      </div>

      <DataTable data={filteredRows} columns={columns} searchPlaceholder="Rechercher un employé..." />
    </div>
  );
}
