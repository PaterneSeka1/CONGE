"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getToken } from "@/lib/auth-client";

type HistoryItem = {
  id: string;
  employeeName: string;
  period: string;
  decision: "APPROVED" | "REJECTED" | "ESCALATED";
  decidedAt: string;
  target?: string;
};

export default function AccountantHistory() {
  const [rows, setRows] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/leave-requests/history?scope=actor", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setRows(
            (data?.decisions ?? []).map((d: any) => ({
              id: d.id,
              employeeName: `${d.leaveRequest?.employee?.firstName ?? ""} ${d.leaveRequest?.employee?.lastName ?? ""}`.trim(),
              period: `${d.leaveRequest?.startDate?.slice(0, 10)} → ${d.leaveRequest?.endDate?.slice(0, 10)}`,
              decision:
                d.type === "APPROVE"
                  ? "APPROVED"
                  : d.type === "REJECT"
                  ? "REJECTED"
                  : d.type === "ESCALATE"
                  ? "ESCALATED"
                  : "CANCELLED",
              decidedAt: d.createdAt?.slice(0, 10) ?? "",
              target: d.toEmployee?.role ?? "—",
            }))
          );
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
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
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement de l'historique...</div>
      ) : null}
    </div>
  );
}
