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

type HistoryItem = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "APPROVED" | "REJECTED" | "CANCELLED";
  decidedAt: string;
  days: number;
};

type ApiLeave = {
  id: string;
  type: string;
  startDate?: string;
  endDate?: string;
  status: LeaveItem["status"] | HistoryItem["status"];
  currentAssignee?: { firstName?: string; lastName?: string } | null;
  decisions?: Array<{ createdAt?: string }>;
};

const ACTIVE_ROUTES = ["/api/leave-requests/my", "/api/leaves"];
const HISTORY_ROUTES = ["/api/leave-requests/history?mine=1", "/api/leaves/history?mine=1"];

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

function statusLabel(status: LeaveItem["status"] | HistoryItem["status"]) {
  if (status === "APPROVED") return "Validée";
  if (status === "REJECTED") return "Refusée";
  if (status === "CANCELLED") return "Annulée";
  if (status === "SUBMITTED") return "Soumise";
  return "En attente";
}

function statusClass(status: LeaveItem["status"] | HistoryItem["status"]) {
  if (status === "APPROVED") return "text-emerald-700";
  if (status === "REJECTED") return "text-red-600";
  if (status === "CANCELLED") return "text-gray-500";
  return "text-amber-700";
}

export default function OperationsLeaveHistory() {
  const [items, setItems] = useState<LeaveItem[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState("ALL");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("ALL");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const fetchFromRoutes = async (routes: string[]) => {
      for (const route of routes) {
        const res = await fetch(route, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return { ok: true as const, data };
      }
      return { ok: false as const, data: {} };
    };

    const load = async () => {
      setIsLoading(true);
      try {
        const result = await fetchFromRoutes(ACTIVE_ROUTES);
        if (!result.ok) {
          toast.error("Impossible de charger les demandes en cours.");
          return;
        }
        const data = result.data;
        setItems(
          (data?.leaves ?? []).map((x: ApiLeave) => ({
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
      } finally {
        setIsLoading(false);
      }
    };

    const loadHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const result = await fetchFromRoutes(HISTORY_ROUTES);
        if (!result.ok) {
          toast.error("Impossible de charger l'historique des demandes.");
          return;
        }
        const data = result.data;
        setHistoryItems(
          (data?.leaves ?? []).map((x: ApiLeave) => {
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
      } finally {
        setIsHistoryLoading(false);
      }
    };

    void load();
    void loadHistory();
  }, []);

  const activeItems = useMemo(
    () => items.filter((item) => ["SUBMITTED", "PENDING"].includes(item.status)),
    [items]
  );

  const filteredActiveItems = useMemo(() => {
    if (activeStatusFilter === "ALL") return activeItems;
    return activeItems.filter((item) => item.status === activeStatusFilter);
  }, [activeItems, activeStatusFilter]);

  const filteredHistoryItems = useMemo(() => {
    if (historyStatusFilter === "ALL") return historyItems;
    return historyItems.filter((item) => item.status === historyStatusFilter);
  }, [historyItems, historyStatusFilter]);

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
      toast.success("Demande annulee.", { id: t });
    } catch {
      toast.error("Erreur reseau lors de l'annulation.", { id: t });
    }
  };

  const columns = useMemo<ColumnDef<LeaveItem>[]>(
    () => [
      { header: "Type", accessorKey: "type" },
      {
        id: "period",
        header: "Periode",
        accessorFn: (row) => `${row.startDate} - ${row.endDate}`,
        cell: ({ row }) => (
          <span>
            {row.original.startDate} - {row.original.endDate}
          </span>
        ),
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
        header: "Assigne",
        accessorFn: (row) => row.currentAssignee ?? "-",
        cell: ({ row }) => row.original.currentAssignee ?? "-",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          if (!["SUBMITTED", "PENDING"].includes(row.original.status)) return "-";
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

  const historyColumns = useMemo<ColumnDef<HistoryItem>[]>(
    () => [
      { header: "Type", accessorKey: "type" },
      {
        id: "period",
        header: "Periode",
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
      { header: "Decision", accessorKey: "decidedAt" },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Mes demandes</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Suivez l&apos;etat de vos demandes en cours de traitement.
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-vdm-gold-700">Filtrer par statut</div>
        <select
          value={activeStatusFilter}
          onChange={(e) => setActiveStatusFilter(e.target.value)}
          className="w-full sm:w-56 rounded-md border border-vdm-gold-200 bg-white px-3 py-2 text-sm text-vdm-gold-900 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
        >
          <option value="ALL">Tous</option>
          <option value="SUBMITTED">Soumise</option>
          <option value="PENDING">En attente</option>
        </select>
      </div>

      <DataTable
        data={filteredActiveItems}
        columns={columns}
        searchPlaceholder="Rechercher une demande..."
        onRefresh={() => window.location.reload()}
      />
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement des demandes...</div>
      ) : null}

      <div className="mt-8">
        <div className="text-lg font-semibold mb-1 text-vdm-gold-800">Historique</div>
        <div className="text-sm text-vdm-gold-700 mb-4">Historique complet de vos demandes.</div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-vdm-gold-700">Filtrer par statut</div>
          <select
            value={historyStatusFilter}
            onChange={(e) => setHistoryStatusFilter(e.target.value)}
            className="w-full sm:w-56 rounded-md border border-vdm-gold-200 bg-white px-3 py-2 text-sm text-vdm-gold-900 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
          >
            <option value="ALL">Tous</option>
            <option value="APPROVED">Validée</option>
            <option value="REJECTED">Refusée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>

        <DataTable
          data={filteredHistoryItems}
          columns={historyColumns}
          searchPlaceholder="Rechercher une demande..."
          onRefresh={() => window.location.reload()}
        />
        {isHistoryLoading ? (
          <div className="mt-3 text-xs text-vdm-gold-700">Chargement de l&apos;historique...</div>
        ) : null}
      </div>
    </div>
  );
}
