"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getToken } from "@/lib/auth-client";

type Req = {
  id: string;
  employeeName: string;
  period: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note?: string;
  origin: "EMPLOYEE" | "MANAGER" | "OTHER";
};

export default function AccountantInbox() {
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
              status: x.status,
              note: x.reason ?? "",
              origin: x.employee?.role === "DEPT_HEAD" ? "MANAGER" : "EMPLOYEE",
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

  const forwardToCeo = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`/api/leaves/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "ESCALATE", toRole: "CEO" }),
    });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const forwardToManager = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`/api/leaves/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: "ESCALATE", toRole: "MANAGER" }),
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
      { header: "Statut", accessorKey: "status" },
      {
        header: "Origine",
        accessorKey: "origin",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          if (row.original.origin === "MANAGER") {
            return (
              <button
                onClick={() => forwardToCeo(row.original.id)}
                className="px-2 py-1 rounded-md bg-vdm-gold-700 text-white text-xs hover:bg-vdm-gold-800"
              >
                Transmettre au CEO
              </button>
            );
          }
          return (
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
                onClick={() => forwardToManager(row.original.id)}
                className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
              >
                Transmettre manager
              </button>
              <button
                onClick={() => forwardToCeo(row.original.id)}
                className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
              >
                Transmettre CEO
              </button>
            </div>
          );
        },
      },
    ],
    [approve, reject, forwardToCeo, forwardToManager]
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Inbox des demandes</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Toutes les demandes de congé arrivent ici. Les demandes issues des managers doivent être
        transmises au CEO.
      </div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Rechercher une demande..." />
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement des demandes...</div>
      ) : null}
    </div>
  );
}
