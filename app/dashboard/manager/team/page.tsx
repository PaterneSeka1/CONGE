"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";

type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  matricule?: string | null;
  jobTitle?: string | null;
  status: "ACTIVE" | "PENDING" | "REJECTED";
  service?: string | null;
};

export default function ManagerTeamPage() {
  const [rows, setRows] = useState<TeamMember[]>([
    {
      id: "1",
      firstName: "Awa",
      lastName: "Traoré",
      email: "awa@ex.com",
      matricule: "EMP020",
      jobTitle: "Développeuse",
      status: "ACTIVE",
      service: "INFORMATION",
    },
  ]);

  const removeEmployee = useCallback(
    async (id: string) => {
      const target = rows.find((r) => r.id === id);
      if (!target) return;
      const ok = window.confirm(`Supprimer ${target.firstName} ${target.lastName} du service ?`);
      if (!ok) return;

      setRows((prev) => prev.filter((r) => r.id !== id));
      // TODO: DELETE /api/manager/team/:id (retirer du service)
    },
    [rows]
  );

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
        cell: ({ row }) => (
          <button
            onClick={() => removeEmployee(row.original.id)}
            className="px-2 py-1 rounded-md border border-red-300 text-red-700 text-xs hover:bg-red-50"
          >
            Supprimer
          </button>
        ),
      },
    ],
    [removeEmployee]
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Équipe</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Liste des employés de votre service. Vous pouvez retirer un employé de votre service.
      </div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Rechercher un employé..." />
    </div>
  );
}
