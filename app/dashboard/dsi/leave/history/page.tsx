"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getToken } from "@/lib/auth-client";

type LeaveItem = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  currentAssignee?: string;
};

export default function DsiLeaveHistory() {
  const [items, setItems] = useState<LeaveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/leave-requests/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setItems(
            (data?.leaves ?? []).map((x: any) => ({
              id: x.id,
              type: x.type,
              startDate: x.startDate?.slice(0, 10) ?? "",
              endDate: x.endDate?.slice(0, 10) ?? "",
              status: x.status,
              currentAssignee: x.currentAssignee
                ? `${x.currentAssignee.firstName} ${x.currentAssignee.lastName}`
                : "—",
            }))
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
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement de l'historique...</div>
      ) : null}
    </div>
  );
}
