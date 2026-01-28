"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";

type PendingEmp = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  matricule?: string | null;
  department?: string;
  service?: string | null;
  status: "PENDING";
};

export default function DsiAccountsPending() {
  const [rows, setRows] = useState<PendingEmp[]>([
    { id: "1", firstName: "Awa", lastName: "Traoré", email: "awa@ex.com", matricule: "EMP020", department: "DAF", status: "PENDING" },
  ]);

  useEffect(() => {
    // TODO: GET /api/admin/employees/pending
  }, []);

  const setDeptFor = (id: string, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, department: value } : row))
    );
  };

  const setServiceFor = (id: string, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, service: value } : row))
    );
  };

  const approve = async (id: string) => {
    const target = rows.find((row) => row.id === id);
    if (!target?.department) {
      alert("Veuillez sélectionner un département avant validation.");
      return;
    }

    // TODO: POST /api/admin/employees/:id/approve { departmentType, serviceType? }
    alert(
      `APPROVE ACCOUNT ${id} (dept=${target.department}, service=${target.service ?? "none"}) (UI)`
    );
  };

  const reject = async (id: string) => {
    // TODO: POST /api/admin/employees/:id/reject
    alert(`REJECT ACCOUNT ${id} (UI)`);
  };

  const columns = useMemo<ColumnDef<PendingEmp>[]>(
    () => [
      {
        id: "employee",
        header: "Employé",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">
              {row.original.firstName} {row.original.lastName}
            </div>
            <div className="text-xs text-vdm-gold-700">{row.original.matricule ?? ""}</div>
          </div>
        ),
      },
      { header: "Email", accessorKey: "email" },
      {
        header: "Département",
        cell: ({ row }) => (
          <select
            value={row.original.department ?? ""}
            onChange={(e) => setDeptFor(row.original.id, e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-1 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
          >
            <option value="">Choisir</option>
            <option value="DSI">DSI</option>
            <option value="DAF">DAF</option>
            <option value="OPERATIONS">OPERATIONS</option>
            <option value="OTHERS">OTHERS</option>
          </select>
        ),
      },
      {
        header: "Service",
        cell: ({ row }) => (
          <select
            value={row.original.service ?? ""}
            onChange={(e) => setServiceFor(row.original.id, e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-1 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
          >
            <option value="">Aucun</option>
            <option value="INFORMATION">INFORMATION</option>
            <option value="REPUTATION">REPUTATION</option>
          </select>
        ),
      },
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
    [approve, reject, setDeptFor, setServiceFor, rows]
  );

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Validation des comptes</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Valider/refuser les nouveaux employés (tous départements).
      </div>

      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Rechercher un employé..."
      />
    </div>
  );
}
