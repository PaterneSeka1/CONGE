"use client";
import { formatDateDMY } from "@/lib/date-format";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getToken } from "@/lib/auth-client";
import toast from "react-hot-toast";

type Req = {
  id: string;
  employeeName: string;
  department?: string;
  period: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note?: string;
  origin: "EMPLOYEE" | "DEPT_HEAD" | "SERVICE_HEAD" | "OTHER";
};

type HistoryItem = {
  id: string;
  employeeName: string;
  period: string;
  decision: "APPROVED" | "REJECTED" | "ESCALATED" | "CANCELLED";
  decidedAt: string;
  target?: string;
  days: number;
};

function statusLabel(status: Req["status"]) {
  if (status === "APPROVED") return "Validée";
  if (status === "REJECTED") return "Refusée";
  return "En attente";
}

function statusClass(status: Req["status"]) {
  if (status === "APPROVED") return "text-emerald-700";
  if (status === "REJECTED") return "text-red-600";
  return "text-amber-700";
}

function decisionLabel(decision: HistoryItem["decision"]) {
  if (decision === "APPROVED") return "Validée";
  if (decision === "REJECTED") return "Refusée";
  if (decision === "CANCELLED") return "Annulée";
  return "Transmise";
}

function decisionClass(decision: HistoryItem["decision"]) {
  if (decision === "APPROVED") return "text-emerald-700";
  if (decision === "REJECTED") return "text-red-600";
  if (decision === "CANCELLED") return "text-gray-500";
  return "text-amber-700";
}

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

export default function AccountantInbox() {
  const [rows, setRows] = useState<Req[]>([]);
  const [historyRows, setHistoryRows] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/leave-requests/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setRows(
            (data?.leaves ?? []).map((x: any) => ({
              id: x.id,
              employeeName: `${x.employee?.firstName ?? ""} ${x.employee?.lastName ?? ""}`.trim(),
              department: x.employee?.department?.type ?? x.employee?.department?.name ?? "",
              period: `${formatDateDMY(x.startDate)} - ${formatDateDMY(x.endDate)}`,
              status: x.status,
              note: x.reason ?? "",
              origin:
                x.employee?.role === "DEPT_HEAD"
                  ? "DEPT_HEAD"
                  : x.employee?.role === "SERVICE_HEAD"
                    ? "SERVICE_HEAD"
                    : "EMPLOYEE",
            }))
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    const loadHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const res = await fetch("/api/leave-requests/history?scope=actor", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setHistoryRows(
            (data?.decisions ?? []).map((d: any) => {
              const startRaw = d.leaveRequest?.startDate ?? "";
              const endRaw = d.leaveRequest?.endDate ?? "";
              const start = formatDateDMY(startRaw);
              const end = formatDateDMY(endRaw);
              return {
                id: d.id,
                employeeName: `${d.leaveRequest?.employee?.firstName ?? ""} ${d.leaveRequest?.employee?.lastName ?? ""}`.trim(),
                period: `${start} - ${end}`,
                decision:
                  d.type === "APPROVE"
                    ? "APPROVED"
                    : d.type === "REJECT"
                    ? "REJECTED"
                    : d.type === "ESCALATE"
                    ? "ESCALATED"
                    : "CANCELLED",
                decidedAt: formatDateDMY(d.createdAt),
                target: d.toEmployee?.role ?? "-",
                days: startRaw && endRaw ? daysBetweenInclusive(startRaw, endRaw) : 0,
              };
            })
          );
        }
      } finally {
        setIsHistoryLoading(false);
      }
    };

    load();
    loadHistory();
  }, []);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(rows.map((row) => row.department).filter((dept): dept is string => !!dept))
      ).sort(),
    [rows]
  );

  const filteredRows = useMemo(
    () => (departmentFilter ? rows.filter((row) => row.department === departmentFilter) : rows),
    [departmentFilter, rows]
  );

  const approve = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const t = toast.loading("Validation en cours...");
    try {
      const res = await fetch(`/api/leave-requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Conge valide.", { id: t });
      } else {
        toast.error("Erreur lors de la validation.", { id: t });
      }
    } catch {
      toast.error("Erreur reseau lors de la validation.", { id: t });
    }
  };

  const reject = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const t = toast.loading("Refus en cours...");
    try {
      const res = await fetch(`/api/leave-requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Conge refuse.", { id: t });
      } else {
        toast.error("Erreur lors du refus.", { id: t });
      }
    } catch {
      toast.error("Erreur reseau lors du refus.", { id: t });
    }
  };

  const forwardToDeptHead = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const t = toast.loading("Transmission au responsable...");
    try {
      const res = await fetch(`/api/leave-requests/${id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toRole: "DEPT_HEAD" }),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Demande transmise au responsable.", { id: t });
      } else {
        toast.error("Erreur lors de la transmission.", { id: t });
      }
    } catch {
      toast.error("Erreur reseau lors de la transmission.", { id: t });
    }
  };

  const forwardToCeo = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const t = toast.loading("Transmission au CEO...");
    try {
      const res = await fetch(`/api/leave-requests/${id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toRole: "CEO" }),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Demande transmise au CEO.", { id: t });
      } else {
        toast.error("Erreur lors de la transmission.", { id: t });
      }
    } catch {
      toast.error("Erreur reseau lors de la transmission.", { id: t });
    }
  };

  const historyColumns = useMemo<ColumnDef<HistoryItem>[]>(
    () => [
      { header: "Employe", accessorKey: "employeeName" },
      { header: "Periode", accessorKey: "period" },
      { header: "Jours", accessorKey: "days" },
      {
        header: "Decision",
        accessorKey: "decision",
        cell: ({ row }) => (
          <span className={`text-xs font-semibold ${decisionClass(row.original.decision)}`}>
            {decisionLabel(row.original.decision)}
          </span>
        ),
      },
      { header: "Cible", accessorKey: "target", cell: ({ row }) => row.original.target ?? "-" },
      { header: "Date", accessorKey: "decidedAt" },
    ],
    []
  );

  const columns = useMemo<ColumnDef<Req>[]>(
    () => [
      {
        header: "Employe",
        accessorKey: "employeeName",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.employeeName}</div>
            <div className="text-xs text-vdm-gold-700">{row.original.note ?? ""}</div>
          </div>
        ),
      },
      { header: "Departement", accessorKey: "department", enableSorting: true },
      { header: "Periode", accessorKey: "period" },
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
        header: "Origine",
        accessorKey: "origin",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isDirector = row.original.origin === "DEPT_HEAD" || row.original.origin === "SERVICE_HEAD";
          return (
            <div className="flex flex-wrap gap-2">
              {isDirector ? (
                <span className="text-xs text-vdm-gold-700">Transmission automatique au CEO</span>
              ) : (
                <>
                  <button
                    onClick={() => approve(row.original.id)}
                    className="px-2 py-1 rounded-md bg-vdm-gold-700 text-white text-xs hover:bg-vdm-gold-800"
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => reject(row.original.id)}
                    className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => forwardToDeptHead(row.original.id)}
                    className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
                  >
                    Transmettre departement
                  </button>
                  <button
                    onClick={() => forwardToCeo(row.original.id)}
                    className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
                  >
                    Transmettre CEO
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [approve, reject, forwardToDeptHead, forwardToCeo]
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Inbox des demandes</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        La comptable peut valider/refuser les demandes des employes. Les demandes des directeurs sont
        transmises au CEO.
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-vdm-gold-700">Filtrer par departement</div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full sm:max-w-xs rounded-md border border-vdm-gold-200 bg-white px-3 py-2 text-sm text-vdm-gold-900 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
        >
          <option value="">Tous les departements</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        data={filteredRows}
        columns={columns}
        searchPlaceholder="Rechercher une demande..."
        onRefresh={() => window.location.reload()}
      />
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement des demandes...</div>
      ) : null}

      <div className="mt-8">
        <div className="text-lg font-semibold mb-1 text-vdm-gold-800">Historique des decisions</div>
        <div className="text-sm text-vdm-gold-700 mb-4">
          Tracabilite des validations et transmissions.
        </div>
        <DataTable
          data={historyRows}
          columns={historyColumns}
          searchPlaceholder="Rechercher une decision..."
          onRefresh={() => window.location.reload()}
        />
        {isHistoryLoading ? (
          <div className="mt-3 text-xs text-vdm-gold-700">Chargement de l'historique...</div>
        ) : null}
      </div>
    </div>
  );
}
