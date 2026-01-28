"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getToken } from "@/lib/auth-client";

type Req = {
  id: string;
  employeeName: string;
  period: string;
  origin: "MANAGER" | "ACCOUNTANT";
  note?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export default function CeoInbox() {
  const [rows, setRows] = useState<Req[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/leaves/inbox", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setRows(
            (data?.leaves ?? []).map((x: any) => ({
              id: x.id,
              employeeName: `${x.employee?.firstName ?? ""} ${x.employee?.lastName ?? ""}`.trim(),
              period: `${x.startDate?.slice(0, 10)} → ${x.endDate?.slice(0, 10)}`,
              origin: "ACCOUNTANT",
              note: x.reason ?? "",
              status: x.status,
            }))
          );
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const approve = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`/api/leaves/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "APPROVE" }),
    });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const reject = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`/api/leaves/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "REJECT" }),
    });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<Req>[]>(
    () => [
      {
        header: "Employé",
        accessorKey: "employeeName",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.employeeName}</div>
            <div className="text-xs text-vdm-gold-700">{row.original.note ?? ""}</div>
          </div>
        ),
      },
      { header: "Période", accessorKey: "period" },
      { header: "Origine", accessorKey: "origin" },
      { header: "Statut", accessorKey: "status" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
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
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Demandes transmises</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Décision finale sur les demandes transmises par la comptable ou les managers.
      </div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Rechercher une demande..." />
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement des demandes...</div>
      ) : null}
    </div>
  );
}
