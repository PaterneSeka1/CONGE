"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";

type HistoryItem = {
  id: string;
  employeeName: string;
  period: string;
  decision: "APPROVED" | "REJECTED" | "ESCALATED";
  decidedAt: string;
  target?: string;
};

export default function AccountantHistory() {
  const [rows, setRows] = useState<HistoryItem[]>([
    {
      id: "1",
      employeeName: "Awa Traoré",
      period: "2026-01-10 → 2026-01-12",
      decision: "APPROVED",
      decidedAt: "2026-01-05",
    },
    {
      id: "2",
      employeeName: "Souleymane Koné",
      period: "2026-02-03 → 2026-02-06",
      decision: "ESCALATED",
      decidedAt: "2026-01-20",
      target: "CEO",
    },
  ]);

  useEffect(() => {
    // TODO: GET /api/leaves/history?scope=accountant
  }, []);

  const columns = useMemo<ColumnDef<HistoryItem>[]>(
    () => [
      { header: "Employé", accessorKey: "employeeName" },
      { header: "Période", accessorKey: "period" },
      { header: "Décision", accessorKey: "decision" },
      {
        header: "Cible",
        accessorKey: "target",
        cell: ({ row }) => row.original.target ?? "—",
      },
      { header: "Date", accessorKey: "decidedAt" },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Historique des décisions</div>
      <div className="text-sm text-vdm-gold-700 mb-4">Traçabilité des validations et transmissions.</div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Rechercher une décision..." />
    </div>
  );
}
