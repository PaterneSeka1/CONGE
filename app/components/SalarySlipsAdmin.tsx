"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth-client";

type EmployeeItem = {
  id: string;
  firstName: string;
  lastName: string;
  matricule?: string | null;
  email: string;
};

type RawEmployeeItem = {
  id?: string;
  firstName?: string;
  lastName?: string;
  matricule?: string | null;
  email?: string;
};

type Slip = {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  fileName: string;
  signedAt?: string | null;
  createdAt: string;
  signedBy?: {
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  employee?: {
    firstName: string;
    lastName: string;
    matricule?: string | null;
    email: string;
  };
};

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function toPeriod(year: number, month: number) {
  const label = MONTH_LABELS[month - 1] ?? String(month);
  return `${label} ${year}`;
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR");
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });
}

export default function SalarySlipsAdmin() {
  const now = new Date();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [file, setFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshEmployees = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const res = await fetch("/api/employees", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(String(data?.error ?? "Impossible de charger la liste des employés"));
      return;
    }

    const list = Array.isArray(data?.employees) ? data.employees : [];
    setEmployees(
      list
        .flatMap((emp: RawEmployeeItem) => {
          if (!emp?.id) return [];
          return [
            {
              id: String(emp.id),
              firstName: String(emp.firstName ?? ""),
              lastName: String(emp.lastName ?? ""),
              matricule: emp.matricule ?? null,
              email: String(emp.email ?? ""),
            },
          ];
        })
        .sort((a: EmployeeItem, b: EmployeeItem) =>
          `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
        )
    );
  }, []);

  const refreshSlips = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    const res = await fetch("/api/salary-slips", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(String(data?.error ?? "Impossible de charger les bulletins"));
      return;
    }

    setSlips(Array.isArray(data?.slips) ? data.slips : []);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([refreshEmployees(), refreshSlips()]);
    } finally {
      setIsLoading(false);
    }
  }, [refreshEmployees, refreshSlips]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const upload = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    if (!employeeId || !month || !year || !file) {
      setError("Sélectionnez un employé, un mois, une année et un PDF.");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Le bulletin doit être au format PDF.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const fileDataUrl = await fileToDataUrl(file);

      const res = await fetch("/api/salary-slips", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          month: Number(month),
          year: Number(year),
          fileName: file.name,
          fileDataUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data?.error ?? "Import impossible"));
        return;
      }

      setSuccess("Bulletin importé avec succès.");
      setFile(null);
      await refreshSlips();
    } catch {
      setError("Erreur réseau");
    } finally {
      setIsSubmitting(false);
    }
  }, [employeeId, month, year, file, refreshSlips]);

  const downloadSlip = useCallback(async (id: string) => {
    const token = getToken();
    if (!token) return;

    setDownloadingId(id);
    try {
      const res = await fetch(`/api/salary-slips/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data?.error ?? "Impossible de télécharger le bulletin"));
        return;
      }

      const slip = data?.slip;
      if (!slip?.fileDataUrl || !slip?.fileName) {
        setError("Fichier indisponible");
        return;
      }
      const fileName = slip.signedAt
        ? String(slip.fileName).replace(/\.pdf$/i, "-signe.pdf")
        : String(slip.fileName);
      const a = document.createElement("a");
      a.href = slip.fileDataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setError("Erreur réseau");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const removeSlip = useCallback(async (id: string) => {
    const token = getToken();
    if (!token) return;

    const confirmed = window.confirm("Retirer ce bulletin non signé ?");
    if (!confirmed) return;

    setRemovingId(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/salary-slips/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data?.error ?? "Impossible de retirer le bulletin"));
        return;
      }

      setSuccess("Bulletin retiré avec succès.");
      await refreshSlips();
    } catch {
      setError("Erreur réseau");
    } finally {
      setRemovingId(null);
    }
  }, [refreshSlips]);

  const employeeOptions = useMemo(
    () =>
      employees.map((emp) => ({
        id: emp.id,
        label: `${emp.lastName} ${emp.firstName}${emp.matricule ? ` (${emp.matricule})` : ""}`,
      })),
    [employees]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-vdm-gold-900">Administration des bulletins</h1>
          <p className="text-sm text-vdm-gold-700">Import des bulletins, puis signature par le CEO.</p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="px-3 py-2 rounded-lg border border-vdm-gold-300 text-sm text-vdm-gold-800 hover:bg-vdm-gold-50"
        >
          Rafraîchir
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>
      )}

      <section className="rounded-xl border border-vdm-gold-200 bg-white p-4 space-y-4">
        <h2 className="text-base font-semibold text-vdm-gold-900">Nouveau bulletin</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm text-vdm-gold-900">
            Employé
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-vdm-gold-300 px-3 py-2"
              disabled={isLoading || isSubmitting}
            >
              <option value="">Sélectionner...</option>
              {employeeOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-vdm-gold-900">
            Mois
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 w-full rounded-lg border border-vdm-gold-300 px-3 py-2"
              disabled={isSubmitting}
            >
              {MONTH_LABELS.map((label, idx) => (
                <option key={label} value={String(idx + 1)}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-vdm-gold-900">
            Année
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 w-full rounded-lg border border-vdm-gold-300 px-3 py-2"
              min={2000}
              max={2100}
              disabled={isSubmitting}
            />
          </label>

        </div>

        <label className="text-sm text-vdm-gold-900 block">
          Bulletin (PDF)
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-900 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            disabled={isSubmitting}
          />
        </label>

        <div>
          <button
            type="button"
            onClick={upload}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-vdm-gold-800 text-white hover:bg-vdm-gold-700 disabled:opacity-60"
          >
            {isSubmitting ? "Import en cours..." : "Importer le bulletin"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-vdm-gold-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-vdm-gold-100">
          <h2 className="text-base font-semibold text-vdm-gold-900">Bulletins importés</h2>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-gray-600">Chargement...</div>
        ) : slips.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">Aucun bulletin importé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-vdm-gold-50 text-vdm-gold-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Employé</th>
                  <th className="px-4 py-3 text-left font-semibold">Période</th>
                  <th className="px-4 py-3 text-left font-semibold">Fichier</th>
                  <th className="px-4 py-3 text-left font-semibold">Statut signature</th>
                  <th className="px-4 py-3 text-left font-semibold">Date d&apos;import</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((slip) => (
                  <tr key={slip.id} className="border-t border-vdm-gold-100">
                    <td className="px-4 py-3">
                      {slip.employee
                        ? `${slip.employee.lastName} ${slip.employee.firstName}${
                            slip.employee.matricule ? ` (${slip.employee.matricule})` : ""
                          }`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">{toPeriod(slip.year, slip.month)}</td>
                    <td className="px-4 py-3">{slip.fileName}</td>
                    <td className="px-4 py-3">
                      {slip.signedAt
                        ? `Signé par ${slip.signedBy?.firstName ?? "CEO"} ${slip.signedBy?.lastName ?? ""} le ${formatDateTime(
                            slip.signedAt
                          )}`.trim()
                        : "En attente CEO"}
                    </td>
                    <td className="px-4 py-3">{formatDate(slip.createdAt)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => downloadSlip(slip.id)}
                        disabled={downloadingId === slip.id || removingId === slip.id}
                        className="px-3 py-1.5 rounded-md border border-vdm-gold-300 text-vdm-gold-800 hover:bg-vdm-gold-50 disabled:opacity-60"
                      >
                        {downloadingId === slip.id ? "Téléchargement..." : "Télécharger"}
                      </button>
                      {!slip.signedAt && (
                        <button
                          type="button"
                          onClick={() => removeSlip(slip.id)}
                          disabled={removingId === slip.id || downloadingId === slip.id}
                          className="px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {removingId === slip.id ? "Retrait..." : "Retirer"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
