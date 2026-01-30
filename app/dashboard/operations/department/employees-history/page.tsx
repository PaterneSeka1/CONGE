"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";

type HistoryItem = {
  id: string;
  employeeName: string;
  action: "JOINED" | "LEFT";
  date: string;
};

export default function OperationsDeptEmployeesHistory() {
  const [rows, setRows] = useState<HistoryItem[]>([
    { id: "1", employeeName: "Jean Kouassi", action: "JOINED", date: "2025-09-01" },
  ]);

  useEffect(() => {
    // TODO: GET /api/departments/operations/employees/history
  }, []);

  const columns = useMemo<ColumnDef<HistoryItem>[]>(
    () => [
      { header: "Employe", accessorKey: "employeeName" },
      { header: "Action", accessorKey: "action" },
      { header: "Date", accessorKey: "date" },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Historique - Employes Operations</div>
      <div className="text-sm text-vdm-gold-700 mb-4">Entrees / sorties du departement.</div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Rechercher un employe..." />
    </div>
  );
}
