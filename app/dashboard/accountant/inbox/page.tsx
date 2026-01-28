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
  origin: "EMPLOYEE" | "MANAGER" | "OTHER";
};

export default function AccountantInbox() {
  const [rows, setRows] = useState<Req[]>([
    {
      id: "1",
      employeeName: "Jean Kouassi",
      period: "2026-02-01 → 2026-02-05",
      status: "PENDING",
      note: "Demande classique",
      origin: "EMPLOYEE",
    },
    {
      id: "2",
      employeeName: "Fatou Diarra",
      period: "2026-03-10 → 2026-03-12",
      status: "PENDING",
      note: "Transmis par manager",
      origin: "MANAGER",
    },
  ]);

  useEffect(() => {
    // TODO: GET /api/leaves/inbox?scope=all
  }, []);

  const approve = async (id: string) => {
    // TODO: POST /api/leaves/:id/decide { type: "APPROVE" }
    alert(`APPROVE ${id} (UI)`);
  };

  const reject = async (id: string) => {
    // TODO: POST /api/leaves/:id/decide { type: "REJECT" }
    alert(`REJECT ${id} (UI)`);
  };

  const forwardToCeo = async (id: string) => {
    // TODO: POST /api/leaves/:id/decide { type: "ESCALATE", to: "CEO" }
    alert(`FORWARD TO CEO ${id} (UI)`);
  };

  const forwardToManager = async (id: string) => {
    // TODO: POST /api/leaves/:id/decide { type: "ESCALATE", to: "MANAGER" }
    alert(`FORWARD TO MANAGER ${id} (UI)`);
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
    </div>
  );
}
