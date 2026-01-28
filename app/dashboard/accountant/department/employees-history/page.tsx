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

export default function AccountantDeptEmployeesHistory() {
  const [rows, setRows] = useState<HistoryItem[]>([
    { id: "1", employeeName: "Mariam Kouadio", action: "JOINED", date: "2025-10-15" },
  ]);

  useEffect(() => {
    // TODO: GET /api/departments/daf/employees/history
  }, []);

  const columns = useMemo<ColumnDef<HistoryItem>[]>(
    () => [
      { header: "Employé", accessorKey: "employeeName" },
      { header: "Action", accessorKey: "action" },
      { header: "Date", accessorKey: "date" },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">
        Historique — Employés DAF
      </div>
      <div className="text-sm text-vdm-gold-700 mb-4">Entrées / sorties du département.</div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Rechercher un employé..." />
    </div>
  );
}
