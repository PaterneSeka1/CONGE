"use client";
import { formatDateDMY } from "@/lib/date-format";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getToken } from "@/lib/auth-client";

type LeaveItem = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "APPROVED" | "REJECTED" | "CANCELLED";
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

export default function EmployeeHistory() {
  const [items, setItems] = useState<LeaveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/leave-requests/history-mine=1", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setItems(
            (data?.leaves ?? []).map((x: any) => {
              const startRaw = x.startDate ?? "";
              const endRaw = x.endDate ?? "";
              const start = formatDateDMY(startRaw);
              const end = formatDateDMY(endRaw);
              return {
                id: x.id,
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

  const columns = useMemo<ColumnDef<LeaveItem>[]>(
    () => [
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
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement de l'historique...</div>
      ) : null}
    </div>
  );
}
