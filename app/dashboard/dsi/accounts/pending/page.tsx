"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/app/components/DataTable";
import { getToken } from "@/lib/auth-client";
import toast from "react-hot-toast";

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
  const [rows, setRows] = useState<PendingEmp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; label: string }[]>([]);
  const [services, setServices] = useState<{ id: string; label: string; departmentId: string }[]>(
    []
  );

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const [res, depRes, svcRes] = await Promise.all([
          fetch("/api/admin/employees/pending", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/departments", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/services", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const data = await res.json().catch(() => ({}));
        const depData = await depRes.json().catch(() => ({}));
        const svcData = await svcRes.json().catch(() => ({}));
        if (res.ok) {
          setRows(
            (data?.employees ?? []).map((e: any) => ({
              id: e.id,
              firstName: e.firstName,
              lastName: e.lastName,
              email: e.email,
              matricule: e.matricule,
              department: e.departmentId ?? "",
              service: e.serviceId ?? "",
              status: e.status,
            }))
          );
          setDepartments(
            (depData?.departments ?? []).map((d: any) => ({
              id: d.id,
              label: d.type ?? d.name ?? d.id,
            }))
          );
          setServices(
            (svcData?.services ?? []).map((s: any) => ({
              id: s.id,
              label: s.type ?? s.name ?? s.id,
              departmentId: s.departmentId,
            }))
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();
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
      toast.error("Veuillez sélectionner un département avant validation.");
      return;
    }
    const token = getToken();
    if (!token) return;

    try {
      const t = toast.loading("Validation en cours...");
      await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          departmentId: target.department || null,
          serviceId: target.service || null,
        }),
      });

      const res = await fetch(`/api/admin/employees/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      if (res.ok) {
        setRows((prev) => prev.filter((row) => row.id !== id));
        toast.success("Compte validé.", { id: t });
        return;
      }
      toast.error("Erreur lors de la validation.", { id: t });
    } catch {
      toast.error("Erreur lors de la validation.");
    }
  };

  const reject = async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const t = toast.loading("Refus en cours...");
      const res = await fetch(`/api/admin/employees/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((row) => row.id !== id));
        toast.success("Compte refusé.", { id: t });
        return;
      }
      toast.error("Erreur lors du refus.", { id: t });
    } catch {
      toast.error("Erreur lors du refus.");
    }
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
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
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
            {services
              .filter((s) => !row.original.department || s.departmentId === row.original.department)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
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
    [approve, reject, setDeptFor, setServiceFor, rows, departments, services]
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
        pageSize={8}
      />
      {isLoading ? (
        <div className="mt-3 text-xs text-vdm-gold-700">Chargement des comptes...</div>
      ) : null}
    </div>
  );
}
