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
  role: "CEO" | "ACCOUNTANT" | "DEPT_HEAD" | "SERVICE_HEAD" | "EMPLOYEE";
  status: "PENDING" | "ACTIVE" | "REJECTED";
  department?: string | null;
  service?: string | null;
};

export default function AccountantDepartmentEmployees() {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Record<string, string>>({});
  const [services, setServices] = useState<Record<string, string>>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EmployeeRow | null>(null);

  const startEdit = (row: EmployeeRow) => {
    setEditingId(row.id);
    setDraft({ ...row });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!draft) return;
    const token = getToken();
    if (!token) return;
    setRows((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
    setEditingId(null);
    setDraft(null);
    await fetch(`/api/employees/${draft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        matricule: draft.matricule,
        jobTitle: draft.jobTitle,
        departmentId: draft.department ?? null,
        serviceId: draft.service ?? null,
      }),
    });
  };

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
        depMap[d.id] = d.name ?? d.type ?? d.id;
      });

      const svcMap: Record<string, string> = {};
      (svcData?.services ?? []).forEach((s: any) => {
        svcMap[s.id] = s.name ?? s.type ?? s.id;
      });

      setDepartments(depMap);
      setServices(svcMap);

      const employees = (empData?.employees ?? []).map((e: any) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        matricule: e.matricule,
        jobTitle: e.jobTitle,
        role: e.role ?? "EMPLOYEE",
        status: e.status ?? "ACTIVE",
        department: e.departmentId ?? null,
        service: e.serviceId ?? null,
      })) as EmployeeRow[];

      setRows(employees.filter((e) => (depMap[e.department ?? ""] ?? "") === "DAF"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const columns = useMemo<ColumnDef<EmployeeRow>[]>(
    () => [
      {
        id: "employee",
        header: "Employé",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        cell: ({ row }) => {
          const isEdit = row.original.id === editingId;
          if (!isEdit || !draft) {
            return (
              <div>
                <div className="font-semibold">
                  {row.original.firstName} {row.original.lastName}
                </div>
                <div className="text-xs text-vdm-gold-700">{row.original.matricule ?? ""}</div>
              </div>
            );
          }
          return (
            <div className="grid gap-2">
              <input
                value={draft.firstName}
                onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                className="w-full rounded-md border border-vdm-gold-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                placeholder="Prénom"
              />
              <input
                value={draft.lastName}
                onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                className="w-full rounded-md border border-vdm-gold-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                placeholder="Nom"
              />
              <input
                value={draft.matricule ?? ""}
                onChange={(e) => setDraft({ ...draft, matricule: e.target.value })}
                className="w-full rounded-md border border-vdm-gold-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                placeholder="Matricule"
              />
            </div>
          );
        },
      },
      {
        header: "Email",
        accessorKey: "email",
        cell: ({ row }) => {
          const isEdit = row.original.id === editingId;
          if (!isEdit || !draft) return row.original.email;
          return (
            <input
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className="w-full rounded-md border border-vdm-gold-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            />
          );
        },
      },
      {
        header: "Poste",
        accessorKey: "jobTitle",
        cell: ({ row }) => {
          const isEdit = row.original.id === editingId;
          if (!isEdit || !draft) return row.original.jobTitle ?? "—";
          return (
            <input
              value={draft.jobTitle ?? ""}
              onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
              className="w-full rounded-md border border-vdm-gold-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            />
          );
        },
      },
      {
        header: "Rôle",
        accessorKey: "role",
        cell: ({ row }) => row.original.role,
      },
      {
        header: "Statut",
        accessorKey: "status",
        cell: ({ row }) => {
          const isEdit = row.original.id === editingId;
          if (!isEdit || !draft) return row.original.status;
          return (
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as EmployeeRow["status"] })
              }
              className="w-full rounded-md border border-vdm-gold-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          );
        },
      },
      {
        header: "Département",
        accessorKey: "department",
        cell: ({ row }) => {
          const isEdit = row.original.id === editingId;
          if (!isEdit || !draft) return departments[row.original.department ?? ""] ?? "—";
          return (
            <input
              value={draft.department ?? ""}
              onChange={(e) => setDraft({ ...draft, department: e.target.value })}
              className="w-full rounded-md border border-vdm-gold-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            />
          );
        },
      },
      {
        header: "Service",
        accessorKey: "service",
        cell: ({ row }) => {
          const isEdit = row.original.id === editingId;
          if (!isEdit || !draft) return services[row.original.service ?? ""] ?? "—";
          return (
            <input
              value={draft.service ?? ""}
              onChange={(e) => setDraft({ ...draft, service: e.target.value })}
              className="w-full rounded-md border border-vdm-gold-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            />
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isEdit = row.original.id === editingId;
          if (!isEdit) {
            return (
              <button
                onClick={() => startEdit(row.original)}
                className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
              >
                Modifier
              </button>
            );
          }
          return (
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="px-2 py-1 rounded-md bg-vdm-gold-700 text-white text-xs hover:bg-vdm-gold-800"
              >
                Enregistrer
              </button>
              <button
                onClick={cancelEdit}
                className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
              >
                Annuler
              </button>
            </div>
          );
        },
      },
    ],
    [editingId, draft, departments, services, saveEdit]
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Employés actuels (DAF)</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Liste des employés du DAF avec toutes les informations. Cliquez sur modifier pour éditer.
      </div>

      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Rechercher un employ?..."
        pageSize={6}
        onRefresh={loadEmployees}
      />
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement des employés...</div>
      ) : null}
    </div>
  );
}
