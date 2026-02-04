"use client";
import { formatDateDMY } from "@/lib/date-format";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getToken } from "@/lib/auth-client";

type PurchaseRow = {
  id: string;
  name: string;
  amount: number;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  items?: Array<{ id: string; name: string; amount: number }>;
};

function formatAmount(value: number) {
  return value.toLocaleString("fr-FR");
}

function statusLabel(status: PurchaseRow["status"]) {
  if (status === "APPROVED") return "Validée";
  if (status === "REJECTED") return "Refusée";
  return "En attente";
}

function statusClass(status: PurchaseRow["status"]) {
  if (status === "APPROVED") return "text-emerald-700";
  if (status === "REJECTED") return "text-red-600";
  return "text-amber-700";
}

export default function OperationsPurchases() {
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    const token = getToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/purchase-requests/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setRows(data?.requests ?? []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onUpdated = () => load();
    window.addEventListener("purchase-requests-updated", onUpdated);
    return () => {
      window.removeEventListener("purchase-requests-updated", onUpdated);
    };
  }, []);

  const columns = useMemo<ColumnDef<PurchaseRow>[]>(
    () => [
      {
        header: "Demande",
        accessorKey: "name",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.name}</div>
            <div className="text-xs text-vdm-gold-700">
              {row.original.items?.length ?? 0} article(s)
            </div>
          </div>
        ),
      },
      {
        header: "Montant",
        accessorKey: "amount",
        cell: ({ row }) => `${formatAmount(row.original.amount)}`,
      },
      {
        header: "Date",
        accessorKey: "date",
        cell: ({ row }) => formatDateDMY(row.original.date),
      },
      {
        header: "Statut",
        accessorKey: "status",
        cell: ({ row }) => (
          <span className={`text-xs font-semibold ${statusClass(row.original.status)}`}>
            {statusLabel(row.original.status)}
          </span>
        ),
      },
      {
        header: "Creation",
        accessorKey: "createdAt",
        cell: ({ row }) => formatDateDMY(row.original.createdAt),
      },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Mes demandes d'achat</div>
      <div className="text-sm text-vdm-gold-700 mb-4">Suivi de vos demandes d'achat.</div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Rechercher une demande..." />
      {isLoading ? <div className="mt-3 text-xs text-vdm-gold-700">Chargement des demandes...</div> : null}
    </div>
  );
}
