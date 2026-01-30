"use client";
import { formatDateDMY } from "@/lib/date-format";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getToken } from "@/lib/auth-client";
import toast from "react-hot-toast";

type LeaveItem = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  currentAssignee?: string;
};

export default function AccountantRequests() {
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
              startDate: formatDateDMY(x.startDate),
              endDate: formatDateDMY(x.endDate),
              status: x.status,
              currentAssignee: x.currentAssignee
                ? `${x.currentAssignee.firstName} ${x.currentAssignee.lastName}`
                : "-",
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
    const t = toast.loading("Annulation en cours...");
    try {
      const res = await fetch(`/api/leave-requests/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        toast.error("Erreur lors de l'annulation.", { id: t });
        return;
      }
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: "CANCELLED" } : x)));
      toast.success("Demande annulée.", { id: t });
    } catch {
      toast.error("Erreur réseau lors de l'annulation.", { id: t });
    }
  };

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
      { header: "Statut", accessorKey: "status" },
      {
        header: "Assigné",
        accessorFn: (row) => row.currentAssignee ?? "-",
        cell: ({ row }) => row.original.currentAssignee ?? "-",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          if (!["SUBMITTED", "PENDING"].includes(row.original.status)) return "—";
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
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Mes demandes (Comptable)</div>
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
