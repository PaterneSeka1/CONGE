"use client";

import { type ChangeEvent, useCallback, useEffect, useState } from "react";
import { getToken } from "@/lib/auth-client";

type Slip = {
  id: string;
  year: number;
  month: number;
  fileName: string;
  createdAt: string;
  signedAt?: string | null;
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

export default function CeoSalarySlipSigning() {
  const [pendingSlips, setPendingSlips] = useState<Slip[]>([]);
  const [signedSlips, setSignedSlips] = useState<Slip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signatureImageDataUrl, setSignatureImageDataUrl] = useState<string | null>(null);
  const [savingSignature, setSavingSignature] = useState(false);

  const fileToDataUrl = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Impossible de lire l'image"));
      reader.readAsDataURL(file);
    });
  }, []);

  const refreshSignature = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const res = await fetch("/api/ceo/signature", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setSignatureImageDataUrl(data?.signatureImageDataUrl ?? null);
  }, []);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const [pendingRes, signedRes] = await Promise.all([
        fetch("/api/salary-slips?unsigned=1", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/salary-slips?signed=1", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const pendingData = await pendingRes.json().catch(() => ({}));
      const signedData = await signedRes.json().catch(() => ({}));

      if (!pendingRes.ok) {
        setError(String(pendingData?.error ?? "Erreur de chargement"));
        return;
      }
      if (!signedRes.ok) {
        setError(String(signedData?.error ?? "Erreur de chargement"));
        return;
      }

      setPendingSlips(Array.isArray(pendingData?.slips) ? pendingData.slips : []);
      setSignedSlips(Array.isArray(signedData?.slips) ? signedData.slips : []);
    } catch {
      setError("Erreur réseau");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) return;
      await refresh();
    };

    load();
    const intervalId = window.setInterval(load, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    const onFocus = () => load();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    refreshSignature();
  }, [refreshSignature]);

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

  const signSlip = useCallback(async (id: string, force = false) => {
    const token = getToken();
    if (!token) return;

    setSigningId(id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/salary-slips/${id}/sign${force ? "?force=1" : ""}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data?.error ?? "Signature impossible"));
        return;
      }

      setSuccess(force ? "Bulletin re-signé et PDF régénéré" : "Bulletin signé");
      await refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSigningId(null);
    }
  }, [refresh]);

  const onSignatureFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("La signature doit être une image");
        return;
      }

      const token = getToken();
      if (!token) return;

      setSavingSignature(true);
      setError(null);
      setSuccess(null);

      try {
        const dataUrl = await fileToDataUrl(file);
        const res = await fetch("/api/ceo/signature", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ signatureImageDataUrl: dataUrl }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(String(data?.error ?? "Impossible d'enregistrer la signature"));
          return;
        }
        setSignatureImageDataUrl(dataUrl);
        setSuccess("Signature image mise à jour");
      } catch {
        setError("Erreur réseau");
      } finally {
        setSavingSignature(false);
        event.target.value = "";
      }
    },
    [fileToDataUrl]
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-vdm-gold-900">Signature des bulletins</h1>
          <p className="text-sm text-vdm-gold-700">Le CEO signe les bulletins importés par la comptable.</p>
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
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>
      )}

      <section className="rounded-xl border border-vdm-gold-200 bg-white p-4 space-y-3">
        <div className="text-sm font-semibold text-vdm-gold-900">Ma signature (image remplaçable)</div>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={onSignatureFileChange}
          disabled={savingSignature}
          className="block w-full rounded-lg border border-vdm-gold-300 bg-vdm-gold-50 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-vdm-gold-800 file:px-3 file:py-1.5 file:text-white"
        />
        <div className="text-xs text-vdm-gold-700">
          {savingSignature
            ? "Enregistrement de la signature..."
            : signatureImageDataUrl
              ? "Signature actuelle enregistrée. Elle sera placée en bas à droite du bulletin lors de la signature."
              : "Aucune signature configurée pour le moment."}
        </div>
        {signatureImageDataUrl && (
          <div className="rounded-md border border-vdm-gold-200 bg-white p-2 inline-block">
            <img src={signatureImageDataUrl} alt="Signature CEO" className="max-h-20 object-contain" />
          </div>
        )}
      </section>

      <div className="rounded-xl border border-vdm-gold-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-sm text-gray-600">Chargement...</div>
        ) : pendingSlips.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">Aucun bulletin en attente de signature.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-vdm-gold-50 text-vdm-gold-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Employé</th>
                  <th className="px-4 py-3 text-left font-semibold">Période</th>
                  <th className="px-4 py-3 text-left font-semibold">Fichier</th>
                  <th className="px-4 py-3 text-left font-semibold">Date d&apos;import</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingSlips.map((slip) => (
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
                    <td className="px-4 py-3">{formatDate(slip.createdAt)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => downloadSlip(slip.id)}
                        disabled={downloadingId === slip.id || signingId === slip.id}
                        className="px-3 py-1.5 rounded-md border border-vdm-gold-300 text-vdm-gold-800 hover:bg-vdm-gold-50 disabled:opacity-60"
                      >
                        {downloadingId === slip.id ? "Téléchargement..." : "Télécharger"}
                      </button>
                      <button
                        type="button"
                        onClick={() => signSlip(slip.id)}
                        disabled={signingId === slip.id || downloadingId === slip.id}
                        className="px-3 py-1.5 rounded-md bg-vdm-gold-800 text-white hover:bg-vdm-gold-700 disabled:opacity-60"
                      >
                        {signingId === slip.id ? "Signature..." : "Signer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-vdm-gold-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-vdm-gold-100">
          <h2 className="text-base font-semibold text-vdm-gold-900">Historique des bulletins signés</h2>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-gray-600">Chargement...</div>
        ) : signedSlips.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">Aucun bulletin signé pour le moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-vdm-gold-50 text-vdm-gold-900">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Employé</th>
                  <th className="px-4 py-3 text-left font-semibold">Période</th>
                  <th className="px-4 py-3 text-left font-semibold">Fichier</th>
                  <th className="px-4 py-3 text-left font-semibold">Signé le (date/heure)</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {signedSlips.map((slip) => (
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
                    <td className="px-4 py-3">{formatDateTime(String(slip.signedAt ?? slip.createdAt))}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => downloadSlip(slip.id)}
                        disabled={downloadingId === slip.id || signingId === slip.id}
                        className="px-3 py-1.5 rounded-md border border-vdm-gold-300 text-vdm-gold-800 hover:bg-vdm-gold-50 disabled:opacity-60"
                      >
                        {downloadingId === slip.id ? "Téléchargement..." : "Télécharger"}
                      </button>
                      <button
                        type="button"
                        onClick={() => signSlip(slip.id, true)}
                        disabled={signingId === slip.id || downloadingId === slip.id}
                        className="px-3 py-1.5 rounded-md bg-vdm-gold-800 text-white hover:bg-vdm-gold-700 disabled:opacity-60"
                      >
                        {signingId === slip.id ? "Re-signature..." : "Re-signer"}
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
