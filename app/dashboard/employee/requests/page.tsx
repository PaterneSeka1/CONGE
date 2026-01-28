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
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  currentAssignee?: string;
};

export default function EmployeeRequests() {
  const [items, setItems] = useState<LeaveItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/leaves?mine=1", {
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

  const cancelRequest = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`/api/leaves/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "CANCEL" }),
    });
    if (!res.ok) {
      alert("Erreur lors de l'annulation.");
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "CANCELLED" } : x)));
  };

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
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          if (row.original.status !== "PENDING") return "—";
          return (
            <button
              onClick={() => cancelRequest(row.original.id)}
              className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
            >
              Annuler
            </button>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Mes demandes</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Suivez l'état de vos demandes en cours.
      </div>

      <DataTable data={items} columns={columns} searchPlaceholder="Rechercher une demande..." />
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement des demandes...</div>
      ) : null}
    </div>
  );
}
