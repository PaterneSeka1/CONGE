"use client";
import { formatDateDMY } from "@/lib/date-format";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import EmployeeAvatar from "@/app/components/EmployeeAvatar";
import { getToken } from "@/lib/auth-client";
import toast from "react-hot-toast";

type Req = {
  id: string;
  firstName: string;
  lastName: string;
  employeeName: string;
  profilePhotoUrl?: string | null;
  department?: string;
  name: string;
  amount: number;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  origin: "DEPT_HEAD" | "SERVICE_HEAD" | "OTHER";
  items?: Array<{ id: string; name: string; amount: number }>;
};

function formatAmount(value: number) {
  return value.toLocaleString("fr-FR");
}

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

function originLabel(origin: Req["origin"]) {
  if (origin === "DEPT_HEAD") return "Directeur des opérations";
  if (origin === "SERVICE_HEAD") return "Directeur adjoint";
  return "Autre";
}

export default function AccountantPurchaseInbox() {
  const [rows, setRows] = useState<Req[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/purchase-requests/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRows(
          (data?.requests ?? []).map((x: any) => ({
            id: x.id,
            firstName: x.employee?.firstName ?? "",
            lastName: x.employee?.lastName ?? "",
            employeeName: `${x.employee?.firstName ?? ""} ${x.employee?.lastName ?? ""}`.trim(),
            profilePhotoUrl: x.employee?.profilePhotoUrl ?? null,
            department: x.employee?.department?.type ?? x.employee?.department?.name ?? "",
            name: x.name,
            amount: x.amount,
            date: x.date,
            status: x.status,
            origin: x.employee?.role === "SERVICE_HEAD" ? "SERVICE_HEAD" : "DEPT_HEAD",
            items: x.items ?? [],
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

  const departments = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.department).filter((dept): dept is string => !!dept))).sort(),
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
      const res = await fetch(`/api/purchase-requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Demande validée.", { id: t });
      } else {
        toast.error("Erreur lors de la validation.", { id: t });
      }
    } catch {
      toast.error("Erreur réseau lors de la validation.", { id: t });
    }
  };

  const reject = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const t = toast.loading("Refus en cours...");
    try {
      const res = await fetch(`/api/purchase-requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Demande refusée.", { id: t });
      } else {
        toast.error("Erreur lors du refus.", { id: t });
      }
    } catch {
      toast.error("Erreur réseau lors du refus.", { id: t });
    }
  };

  const forwardToCeo = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const t = toast.loading("Transmission au PDG...");
    try {
      const res = await fetch(`/api/purchase-requests/${id}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toRole: "CEO" }),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Demande transmise au PDG.", { id: t });
      } else {
        toast.error("Erreur lors de la transmission.", { id: t });
      }
    } catch {
      toast.error("Erreur réseau lors de la transmission.", { id: t });
    }
  };

  const columns = useMemo<ColumnDef<Req>[]>(
    () => [
      {
        header: "Demandeur",
        accessorKey: "employeeName",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <EmployeeAvatar
              firstName={row.original.firstName}
              lastName={row.original.lastName}
              profilePhotoUrl={row.original.profilePhotoUrl}
            />
            <div>
              <div className="font-semibold">{row.original.employeeName}</div>
              <div className="text-xs text-vdm-gold-700">{originLabel(row.original.origin)}</div>
            </div>
          </div>
        ),
      },
      { header: "Département", accessorKey: "department" },
      {
        header: "Demande",
        accessorKey: "name",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.name}</div>
            <div className="text-xs text-vdm-gold-700">{row.original.items?.length ?? 0} article(s)</div>
          </div>
        ),
      },
      {
        header: "Montant",
        accessorKey: "amount",
        cell: ({ row }) => formatAmount(row.original.amount),
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
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
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
              onClick={() => forwardToCeo(row.original.id)}
              className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
            >
              Transmettre au PDG
            </button>
          </div>
        ),
      },
    ],
    [approve, reject, forwardToCeo]
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Inbox des demandes d&apos;achats futurs</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        La comptable peut valider, refuser ou transmettre au PDG.
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-vdm-gold-700">Filtrer par département</div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full sm:max-w-xs rounded-md border border-vdm-gold-200 bg-white px-3 py-2 text-sm text-vdm-gold-900 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
        >
          <option value="">Tous les départements</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <DataTable data={filteredRows} columns={columns} searchPlaceholder="Rechercher une demande..." onRefresh={load} />
      {isLoading ? <div className="mt-3 text-xs text-vdm-gold-700">Chargement des demandes...</div> : null}
    </div>
  );
}
