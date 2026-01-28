"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getToken } from "@/lib/auth-client";

type EmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  matricule?: string | null;
  jobTitle?: string | null;
  role: "CEO" | "ACCOUNTANT" | "DEPT_HEAD" | "EMPLOYEE";
  status: "PENDING" | "ACTIVE" | "REJECTED";
  departmentId?: string | null;
  serviceId?: string | null;
};

export default function CeoEmployees() {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Record<string, string>>({});
  const [services, setServices] = useState<Record<string, string>>({});

  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const deptType = departments[r.departmentId ?? ""] ?? "ALL";
      const svcType = services[r.serviceId ?? ""] ?? "NONE";
      if (departmentFilter !== "ALL" && deptType !== departmentFilter) return false;
      if (roleFilter !== "ALL" && r.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (serviceFilter !== "ALL" && svcType !== serviceFilter) return false;
      return true;
    });
  }, [rows, departmentFilter, roleFilter, statusFilter, serviceFilter, departments, services]);

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
      {
        header: "Département",
        accessorFn: (row) => departments[row.departmentId ?? ""] ?? "—",
        cell: ({ row }) => departments[row.original.departmentId ?? ""] ?? "—",
      },
      {
        header: "Service",
        accessorFn: (row) => services[row.serviceId ?? ""] ?? "—",
        cell: ({ row }) => services[row.original.serviceId ?? ""] ?? "—",
      },
    ],
    [departments, services]
  );

  const loadEmployees = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const [empRes, depRes, svcRes] = await Promise.all([
        fetch("/api/employees", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/departments", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/services", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const empData = await empRes.json().catch(() => ({}));
      const depData = await depRes.json().catch(() => ({}));
      const svcData = await svcRes.json().catch(() => ({}));

      const depMap: Record<string, string> = {};
      (depData?.departments ?? []).forEach((d: any) => {
        depMap[d.id] = d.type ?? d.name ?? d.id;
      });

      const svcMap: Record<string, string> = {};
      (svcData?.services ?? []).forEach((s: any) => {
        svcMap[s.id] = s.type ?? s.name ?? s.id;
      });

      setDepartments(depMap);
      setServices(svcMap);

      setRows(
        (empData?.employees ?? []).map((e: any) => ({
          id: e.id,
          firstName: e.firstName,
          lastName: e.lastName,
          email: e.email,
          matricule: e.matricule,
          jobTitle: e.jobTitle,
          role: e.role ?? "EMPLOYEE",
          status: e.status ?? "ACTIVE",
          departmentId: e.departmentId ?? null,
          serviceId: e.serviceId ?? null,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

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
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement des employés...</div>
      ) : null}
    </div>
  );
}
