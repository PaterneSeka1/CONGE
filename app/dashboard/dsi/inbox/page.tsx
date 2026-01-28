"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";

type Req = {
  id: string;
  employeeName: string;
  period: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note?: string;
};

export default function DsiInbox() {
  const [rows, setRows] = useState<Req[]>([
    { id: "1", employeeName: "Jean Kouassi", period: "2026-02-01 → 2026-02-05", status: "PENDING", note: "Besoin d’avis DSI" },
  ]);

  useEffect(() => {
    // TODO: GET /api/leaves/assigned-to-me (ou /api/leaves/inbox?scope=department)
  }, []);

  const approve = async (id: string) => {
    // TODO: POST /api/leaves/:id/decide { type: "APPROVE" }
    alert(`APPROVE ${id} (UI)`);
  };

  const reject = async (id: string) => {
    // TODO: POST /api/leaves/:id/decide { type: "REJECT" }
    alert(`REJECT ${id} (UI)`);
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
    [approve, reject]
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Demandes transmises</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Demandes provenant de la comptable pour décision.
      </div>

      <DataTable data={rows} columns={columns} searchPlaceholder="Rechercher une demande..." />
    </div>
  );
}
