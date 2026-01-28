"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";

type LeaveItem = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  currentAssignee?: string;
};

export default function DsiLeaveHistory() {
  const [items, setItems] = useState<LeaveItem[]>([
    // placeholder UI
    { id: "1", type: "ANNUAL", startDate: "2026-02-01", endDate: "2026-02-05", status: "PENDING", currentAssignee: "Comptable" },
    { id: "2", type: "SICK", startDate: "2025-11-10", endDate: "2025-11-12", status: "APPROVED", currentAssignee: "—" },
  ]);

  useEffect(() => {
    // TODO: GET /api/leaves/mine
  }, []);

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
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Historique de mes congés</div>
      <div className="text-sm text-vdm-gold-700 mb-4">Statuts : validé, refusé, en attente.</div>

      <DataTable data={items} columns={columns} searchPlaceholder="Rechercher un congé..." />
    </div>
  );
}
