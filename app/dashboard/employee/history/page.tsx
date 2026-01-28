"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";

type LeaveItem = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "APPROVED" | "REJECTED" | "CANCELLED";
  decidedAt: string;
};

export default function EmployeeHistory() {
  const [items, setItems] = useState<LeaveItem[]>([
    { id: "1", type: "ANNUAL", startDate: "2026-01-10", endDate: "2026-01-12", status: "APPROVED", decidedAt: "2026-01-05" },
    { id: "2", type: "SICK", startDate: "2025-11-10", endDate: "2025-11-12", status: "REJECTED", decidedAt: "2025-11-01" },
  ]);

  useEffect(() => {
    // TODO: GET /api/leaves/history?mine=1
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
      { header: "Décision", accessorKey: "decidedAt" },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Historique</div>
      <div className="text-sm text-vdm-gold-700 mb-4">Historique complet de vos demandes.</div>

      <DataTable data={items} columns={columns} searchPlaceholder="Rechercher une demande..." />
    </div>
  );
}
