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
  days: number;
};

function toUtcDay(value: string | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function daysBetweenInclusive(start: string, end: string) {
  const s = toUtcDay(start);
  const e = toUtcDay(end);
  if (s == null || e == null) return 0;
  if (e < s) return 0;
  return Math.floor((e - s) / 86400000) + 1;
}

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
            (data?.decisions ?? []).map((d: any) => {
              const start = d.leaveRequest?.startDate?.slice(0, 10) ?? "";
              const end = d.leaveRequest?.endDate?.slice(0, 10) ?? "";
              return {
                id: d.id,
                employeeName: `${d.leaveRequest?.employee?.firstName ?? ""} ${d.leaveRequest?.employee?.lastName ?? ""}`.trim(),
                period: `${start} -> ${end}`,
                decision:
                  d.type === "APPROVE"
                    ? "APPROVED"
                    : d.type === "REJECT"
                    ? "REJECTED"
                    : d.type === "ESCALATE"
                    ? "ESCALATED"
                    : "CANCELLED",
                decidedAt: d.createdAt?.slice(0, 10) ?? "",
                target: d.toEmployee?.role ?? "-",
                days: start && end ? daysBetweenInclusive(start, end) : 0,
              };
            })
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
      { header: "Employe", accessorKey: "employeeName" },
      { header: "Periode", accessorKey: "period" },
      { header: "Jours", accessorKey: "days" },
      { header: "Decision", accessorKey: "decision" },
      {
        header: "Cible",
        accessorKey: "target",
        cell: ({ row }) => row.original.target ?? "-",
      },
      { header: "Date", accessorKey: "decidedAt" },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Historique des decisions</div>
      <div className="text-sm text-vdm-gold-700 mb-4">Traçabilite des validations et transmissions.</div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Rechercher une decision..." />
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement de l'historique...</div>
      ) : null}
    </div>
  );
}
