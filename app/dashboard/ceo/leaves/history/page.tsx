"use client";
import { formatDateDMY } from "@/lib/date-format";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getToken } from "@/lib/auth-client";

type HistoryItem = {
  id: string;
  employeeName: string;
  employeeRole: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  decidedAt: string;
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

function statusLabel(status: string) {
  if (status === "APPROVED") return "Validée";
  if (status === "REJECTED") return "Refusée";
  if (status === "CANCELLED") return "Annulée";
  if (status === "SUBMITTED") return "Soumise";
  if (status === "PENDING") return "En attente";
  return status;
}

function statusClass(status: string) {
  if (status === "APPROVED") return "text-emerald-700";
  if (status === "REJECTED") return "text-red-600";
  if (status === "CANCELLED") return "text-gray-500";
  return "text-amber-700";
}

export default function CeoLeavesHistory() {
  const [rows, setRows] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/leave-requests/history?scope=all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setRows(
            (data?.leaves ?? []).map((x: any) => {
              const startRaw = x.startDate ?? "";
              const endRaw = x.endDate ?? "";
              const start = formatDateDMY(startRaw);
              const end = formatDateDMY(endRaw);
              const emp = x.employee ?? {};
              return {
                id: x.id,
                employeeName: `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || "—",
                employeeRole: emp.role ?? "—",
                type: x.type,
                startDate: start,
                endDate: end,
                status: x.status,
                decidedAt: formatDateDMY(x.decisions?.[0]?.createdAt),
                days: startRaw && endRaw ? daysBetweenInclusive(startRaw, endRaw) : 0,
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
      {
        header: "Employé",
        accessorKey: "employeeName",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.employeeName}</div>
            <div className="text-xs text-vdm-gold-700">{row.original.employeeRole}</div>
          </div>
        ),
      },
      { header: "Type", accessorKey: "type" },
      {
        id: "period",
        header: "Période",
        accessorFn: (row) => `${row.startDate} - ${row.endDate}`,
        cell: ({ row }) => (
          <span>
            {row.original.startDate} - {row.original.endDate}
          </span>
        ),
      },
      { header: "Jours", accessorKey: "days" },
      {
        header: "Statut",
        accessorKey: "status",
        cell: ({ row }) => (
          <span className={`text-xs font-semibold ${statusClass(row.original.status)}`}>
            {statusLabel(row.original.status)}
          </span>
        ),
      },
      { header: "Décision", accessorKey: "decidedAt" },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Historique global des congés</div>
      <div className="text-sm text-vdm-gold-700 mb-4">Toutes les demandes traitées par l'entreprise.</div>

      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Rechercher un employ?..."
        onRefresh={() => window.location.reload()}
      />
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement de l'historique...</div>
      ) : null}
    </div>
  );
}
