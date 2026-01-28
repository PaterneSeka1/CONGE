"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";

type LeaveItem = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  currentAssignee?: string;
};

export default function EmployeeRequests() {
  const [items, setItems] = useState<LeaveItem[]>([
    { id: "1", type: "ANNUAL", startDate: "2026-02-01", endDate: "2026-02-05", status: "PENDING", currentAssignee: "Manager" },
    { id: "2", type: "SICK", startDate: "2025-11-10", endDate: "2025-11-12", status: "APPROVED", currentAssignee: "Comptable" },
  ]);

  useEffect(() => {
    // TODO: GET /api/leaves/mine
  }, []);

  const cancelRequest = async (id: string) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "CANCELLED" } : x)));
    // TODO: POST /api/leaves/:id/decide { type: "CANCEL" }
  };

  const columns = useMemo<ColumnDef<LeaveItem>[]>(
    () => [
      { header: "Type", accessorKey: "type" },
      {
        id: "period",
        header: "Période",
        accessorFn: (row) => `${row.startDate} -> ${row.endDate}`,
        cell: ({ row }) => (
          <span>
            {row.original.startDate} → {row.original.endDate}
          </span>
        ),
      },
      { header: "Statut", accessorKey: "status" },
      {
        header: "Assigné",
        accessorFn: (row) => row.currentAssignee ?? "—",
        cell: ({ row }) => row.original.currentAssignee ?? "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          if (row.original.status !== "PENDING") return "—";
          return (
            <button
              onClick={() => cancelRequest(row.original.id)}
              className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
            >
              Annuler
            </button>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Mes demandes</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Suivez l'état de vos demandes en cours.
      </div>

      <DataTable data={items} columns={columns} searchPlaceholder="Rechercher une demande..." />
    </div>
  );
}
