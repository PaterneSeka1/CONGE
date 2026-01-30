"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getEmployee, getToken } from "@/lib/auth-client";

type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  matricule?: string | null;
  jobTitle?: string | null;
  status: "ACTIVE" | "PENDING" | "REJECTED";
  service?: string | null;
  departmentId?: string | null;
};

export default function ManagerTeamPage() {
  const [rows, setRows] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const manager = useMemo(() => getEmployee(), []);

  const removeEmployee = useCallback(
    async (id: string) => {
      const target = rows.find((r) => r.id === id);
      if (!target) return;
      const ok = window.confirm(`Supprimer ${target.firstName} ${target.lastName} du service -`);
      if (!ok) return;

      setRows((prev) => prev.filter((r) => r.id !== id));
      const token = getToken();
      if (!token) return;
      const res = await fetch(`/api/manager/team/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert("Erreur lors de la suppression.");
      }
    },
    [rows]
  );

  const loadTeam = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const me = getEmployee();
    if (!me) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      const employees = (data?.employees ?? []).map((e: any) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        matricule: e.matricule,
        jobTitle: e.jobTitle,
        status: e.status ?? "ACTIVE",
        service: e.serviceId ?? null,
        departmentId: e.departmentId ?? null,
      })) as TeamMember[];

      const filtered = employees.filter((e) => {
        if (me.serviceId) return e.service === me.serviceId;
        if (me.departmentId) return e.departmentId === me.departmentId;
        return true;
      });

      setRows(filtered);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const columns = useMemo<ColumnDef<TeamMember>[]>(
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
      { header: "Statut", accessorKey: "status" },
      { header: "Service", accessorKey: "service" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const canDelete =
            (manager?.serviceId && row.original.service === manager.serviceId) ||
            (!manager?.serviceId && manager?.departmentId && row.original.departmentId === manager.departmentId);
          if (!canDelete) return "—";
          return (
            <button
              onClick={() => removeEmployee(row.original.id)}
              className="px-2 py-1 rounded-md border border-red-300 text-red-700 text-xs hover:bg-red-50"
            >
              Supprimer
            </button>
          );
        },
      },
    ],
    [removeEmployee, manager]
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Équipe</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Liste des employés de votre service. Vous pouvez retirer un employé de votre service.
      </div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Rechercher un employé..." />
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement de l'équipe...</div>
      ) : null}
    </div>
  );
}
