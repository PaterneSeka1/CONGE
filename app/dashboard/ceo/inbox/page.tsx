"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";

type Req = {
  id: string;
  employeeName: string;
  period: string;
  origin: "MANAGER" | "ACCOUNTANT";
  note?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export default function CeoInbox() {
  const [rows, setRows] = useState<Req[]>([
    {
      id: "1",
      employeeName: "Fatou Diarra",
      period: "2026-03-10 → 2026-03-12",
      origin: "MANAGER",
      note: "Transmis par manager",
      status: "PENDING",
    },
    {
      id: "2",
      employeeName: "Awa Traoré",
      period: "2026-02-01 → 2026-02-05",
      origin: "ACCOUNTANT",
      note: "Transmis par comptable",
      status: "PENDING",
    },
  ]);

  useEffect(() => {
    // TODO: GET /api/leaves/escalated
  }, []);

  const approve = async (id: string) => {
    // TODO: POST /api/leaves/:id/decide { type: "APPROVE" }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r)));
  };

  const reject = async (id: string) => {
    // TODO: POST /api/leaves/:id/decide { type: "REJECT" }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r)));
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
    </div>
  );
}
