"use client";
import { formatDateDMY } from "@/lib/date-format";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import EmployeeAvatar from "@/app/components/EmployeeAvatar";
import { getToken } from "@/lib/auth-client";

type HistoryItem = {
  id: string;
  firstName: string;
  lastName: string;
  employeeName: string;
  profilePhotoUrl?: string | null;
  decidedBy: string;
  name: string;
  amount: number;
  date: string;
  decision: "APPROVED" | "REJECTED" | "ESCALATED";
  decidedAt: string;
  target?: string;
  items?: Array<{ id: string; name: string; amount: number }>;
};

function formatAmount(value: number) {
  return value.toLocaleString("fr-FR");
}

function decisionLabel(decision: HistoryItem["decision"]) {
  if (decision === "APPROVED") return "Validée";
  if (decision === "REJECTED") return "Refusée";
  return "Transmise";
}

function decisionClass(decision: HistoryItem["decision"]) {
  if (decision === "APPROVED") return "text-emerald-700";
  if (decision === "REJECTED") return "text-red-600";
  return "text-amber-700";
}

export default function CeoPurchaseHistory() {
  const [rows, setRows] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/purchase-requests/history?scope=all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRows(
          (data?.decisions ?? []).map((d: {
            id: string;
            type: "APPROVE" | "REJECT" | "ESCALATE";
            createdAt: string;
            toEmployee?: { role?: string } | null;
            actor?: { firstName?: string; lastName?: string; role?: string } | null;
            purchaseRequest?: {
              employee?: { firstName?: string; lastName?: string; profilePhotoUrl?: string } | null;
              name?: string;
              amount?: number;
              date?: string;
              items?: Array<{ id: string; name: string; amount: number }>;
            } | null;
          }) => ({
            id: d.id,
            firstName: d.purchaseRequest?.employee?.firstName ?? "",
            lastName: d.purchaseRequest?.employee?.lastName ?? "",
            employeeName: `${d.purchaseRequest?.employee?.firstName ?? ""} ${d.purchaseRequest?.employee?.lastName ?? ""}`.trim(),
            profilePhotoUrl: d.purchaseRequest?.employee?.profilePhotoUrl ?? null,
            decidedBy:
              `${d.actor?.firstName ?? ""} ${d.actor?.lastName ?? ""}`.trim() ||
              d.actor?.role ||
              "-",
            name: d.purchaseRequest?.name ?? "",
            amount: d.purchaseRequest?.amount ?? 0,
            date: d.purchaseRequest?.date ?? "",
            items: d.purchaseRequest?.items ?? [],
            decision:
              d.type === "APPROVE" ? "APPROVED" : d.type === "REJECT" ? "REJECTED" : "ESCALATED",
            decidedAt: formatDateDMY(d.createdAt),
            target: d.toEmployee?.role ?? "-",
          }))
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo<ColumnDef<HistoryItem>[]>(
    () => [
      {
        header: "Employe",
        accessorKey: "employeeName",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <EmployeeAvatar
              firstName={row.original.firstName}
              lastName={row.original.lastName}
              profilePhotoUrl={row.original.profilePhotoUrl}
            />
            <div className="font-semibold">{row.original.employeeName}</div>
          </div>
        ),
      },
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
        cell: ({ row }) => formatAmount(row.original.amount),
      },
      { header: "Date", accessorKey: "date", cell: ({ row }) => formatDateDMY(row.original.date) },
      {
        header: "Decision",
        accessorKey: "decision",
        cell: ({ row }) => (
          <span className={`text-xs font-semibold ${decisionClass(row.original.decision)}`}>
            {decisionLabel(row.original.decision)}
          </span>
        ),
      },
      { header: "Decide par", accessorKey: "decidedBy" },
      { header: "Cible", accessorKey: "target", cell: ({ row }) => row.original.target ?? "-" },
      { header: "Date decision", accessorKey: "decidedAt" },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Historique des achats futurs</div>
      <div className="text-sm text-vdm-gold-700 mb-4">Traçabilité globale des décisions (CEO et autres valideurs).</div>

      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Rechercher une decision..."
        onRefresh={load}
      />
      {isLoading ? <div className="mt-3 text-xs text-vdm-gold-700">Chargement...</div> : null}
    </div>
  );
}
