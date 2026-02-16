"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth-client";

type Slip = {
  id: string;
  year: number;
  month: number;
  fileName: string;
  signedAt?: string | null;
  signedBy?: {
    firstName: string;
    lastName: string;
    role: string;
  } | null;
  createdAt: string;
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

export default function MySalarySlips() {
  const [slips, setSlips] = useState<Slip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/salary-slips?mine=1&signed=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(String(data?.error ?? "Erreur de chargement"));
        return;
      }

      setSlips(Array.isArray(data?.slips) ? data.slips : []);
    } catch {
      setError("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasSlips = useMemo(() => slips.length > 0, [slips.length]);

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

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-vdm-gold-900">Bulletins de salaire</h1>
          <p className="text-sm text-vdm-gold-700">Retrouvez les bulletins signés par le CEO.</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="px-3 py-2 rounded-lg border border-vdm-gold-300 text-sm text-vdm-gold-800 hover:bg-vdm-gold-50"
        >
          Rafraîchir
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-vdm-gold-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-sm text-gray-600">Chargement...</div>
        ) : !hasSlips ? (
          <div className="p-4 text-sm text-gray-600">Aucun bulletin disponible pour le moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-vdm-gold-50 text-vdm-gold-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Période</th>
                  <th className="px-4 py-3 text-left font-semibold">Fichier</th>
                  <th className="px-4 py-3 text-left font-semibold">Signé par</th>
                  <th className="px-4 py-3 text-left font-semibold">Date/heure de signature</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((slip) => (
                  <tr key={slip.id} className="border-t border-vdm-gold-100">
                    <td className="px-4 py-3">{toPeriod(slip.year, slip.month)}</td>
                    <td className="px-4 py-3">{slip.fileName}</td>
                    <td className="px-4 py-3">
                      {slip.signedBy ? `${slip.signedBy.firstName} ${slip.signedBy.lastName}` : "CEO"}
                    </td>
                    <td className="px-4 py-3">{formatDateTime(String(slip.signedAt ?? slip.createdAt))}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => downloadSlip(slip.id)}
                        disabled={downloadingId === slip.id}
                        className="px-3 py-1.5 rounded-md border border-vdm-gold-300 text-vdm-gold-800 hover:bg-vdm-gold-50 disabled:opacity-60"
                      >
                        {downloadingId === slip.id ? "Téléchargement..." : "Télécharger"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
