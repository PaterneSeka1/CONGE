"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import EmployeeAvatar from "@/app/components/EmployeeAvatar";
import { getEmployee, getToken } from "@/lib/auth-client";

type EmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl?: string | null;
  matricule?: string | null;
  jobTitle?: string | null;
  role: "CEO" | "ACCOUNTANT" | "DEPT_HEAD" | "SERVICE_HEAD" | "EMPLOYEE";
  status: "PENDING" | "ACTIVE" | "REJECTED";
  department?: string | null;
  service?: string | null;
  departmentName?: string;
  serviceName?: string;
};

type EmployeeApiItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhotoUrl?: string | null;
  matricule?: string | null;
  jobTitle?: string | null;
  role?: EmployeeRow["role"];
  status?: EmployeeRow["status"];
  departmentId?: string | null;
  serviceId?: string | null;
  department?: { id: string; name?: string | null; type?: string | null } | null;
  service?: { id: string; name?: string | null; type?: string | null } | null;
};

const statusLabel: Record<EmployeeRow["status"], string> = {
  ACTIVE: "Actif",
  PENDING: "En attente",
  REJECTED: "Rejeté",
};

const roleLabel: Record<EmployeeRow["role"], string> = {
  CEO: "PDG",
  ACCOUNTANT: "Comptable",
  DEPT_HEAD: "Chef de département",
  SERVICE_HEAD: "Directeur Adjoint",
  EMPLOYEE: "Employé",
};

export default function DsiDepartmentEmployees() {
  const currentEmployee = useMemo(() => getEmployee(), []);
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const saveEdit = useCallback(async () => {
    if (!draft) return;
    const token = getToken();
    if (!token) return;

    // optimistic update
    setRows((prev) => prev.map((r) => (r.id === draft.id ? draft : r)));
    setEditingId(null);
    setDraft(null);

    await fetch(`/api/employees/${draft.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        firstName: draft.firstName,
        lastName: draft.lastName,
        jobTitle: draft.jobTitle,
        departmentId: draft.department ?? null,
        serviceId: draft.service ?? null,
      }),
    });
  }, [draft]);

  const loadEmployees = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const empRes = await fetch("/api/departments/dsi/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const empData = await empRes.json().catch(() => ({}));
      if (!empRes.ok) {
        setRows([]);
        return;
      }

      const employeesList = Array.isArray(empData?.employees) ? (empData.employees as EmployeeApiItem[]) : [];
      const employees = employeesList.map((e) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        profilePhotoUrl: e.profilePhotoUrl ?? null,
        matricule: e.matricule,
        jobTitle: e.jobTitle,
        role: e.role ?? "EMPLOYEE",
        status: e.status ?? "ACTIVE",
        department: e.departmentId ?? null,
        service: e.serviceId ?? null,
        departmentName: e.department?.name ?? e.department?.type ?? "—",
        serviceName: e.service?.name ?? e.service?.type ?? "—",
      })) as EmployeeRow[];

      setRows(employees.filter((e) => e.id !== currentEmployee?.id));
    } finally {
      setIsLoading(false);
    }
  }, [currentEmployee?.id]);

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
              <div className="flex items-center gap-2">
                <EmployeeAvatar
                  firstName={row.original.firstName}
                  lastName={row.original.lastName}
                  profilePhotoUrl={row.original.profilePhotoUrl}
                />
                <div>
                  <div className="font-semibold">
                    {row.original.firstName} {row.original.lastName}
                  </div>
                  <div className="text-xs text-vdm-gold-700">{row.original.matricule ?? ""}</div>
                </div>
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
                readOnly
                className="w-full rounded-md border border-vdm-gold-200 bg-vdm-gold-50 px-2 py-1 text-sm text-vdm-gold-800"
              />
            </div>
          );
        },
      },
      {
        header: "E-mail",
        accessorKey: "email",
        cell: ({ row }) => {
          const isEdit = row.original.id === editingId;
          if (!isEdit || !draft) return row.original.email;
          return (
            <input
              value={draft.email}
              readOnly
              className="w-full rounded-md border border-vdm-gold-200 bg-vdm-gold-50 px-2 py-1 text-sm text-vdm-gold-800"
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
        cell: ({ row }) => roleLabel[row.original.role] ?? row.original.role,
      },
      {
        header: "Statut",
        accessorKey: "status",
        cell: ({ row }) => {
          const isEdit = row.original.id === editingId;
          const current = isEdit && draft ? draft.status : row.original.status;
          return (
            <span className={isEdit ? "text-vdm-gold-700" : ""}>
              {statusLabel[current] ?? current}
            </span>
          );
        },
      },
      {
        header: "Département",
        accessorKey: "department",
        cell: ({ row }) => {
          const isEdit = row.original.id === editingId;
          if (!isEdit || !draft) return row.original.departmentName ?? "—";
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
          if (!isEdit || !draft) return row.original.serviceName ?? "—";
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
    [editingId, draft, saveEdit]
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Employés actuels</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Liste des employés du département DSI. Cliquez sur « Modifier » pour éditer.
      </div>

      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Rechercher un employé…"
        pageSize={10}
        onRefresh={loadEmployees}
      />
      {isLoading ? <div className="mt-3 text-xs text-vdm-gold-700">Chargement des employés...</div> : null}
    </div>
  );
}
