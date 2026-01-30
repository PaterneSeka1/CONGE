"use client";
import { formatDateDMY } from "@/lib/date-format";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getToken } from "@/lib/auth-client";

type Department = { id: string; type: string; name: string };
type Blackout = {
  id: string;
  title?: string | null;
  reason?: string | null;
  startDate: string;
  endDate: string;
  departmentId?: string | null;
  department?: { id: string; type: string; name: string } | null;
};

export default function CeoBlackouts() {
  const [items, setItems] = useState<Blackout[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [departmentId, setDepartmentId] = useState("ALL");

  const deptOptions = useMemo(
    () => [{ id: "ALL", type: "ALL", name: "Tous les départements" }, ...departments],
    [departments]
  );

  const load = async () => {
    const token = getToken();
    if (!token) return;
    const [blackoutRes, deptRes] = await Promise.all([
      fetch("/api/leave-blackouts", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/departments", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const blackoutData = await blackoutRes.json().catch(() => ({}));
    const deptData = await deptRes.json().catch(() => ({}));
    if (blackoutRes.ok) setItems(blackoutData?.blackouts ?? []);
    if (deptRes.ok) {
      setDepartments((deptData?.departments ?? []).map((d: any) => ({
        id: d.id,
        type: d.type ?? d.name ?? d.id,
        name: d.name ?? d.type ?? d.id,
      })));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createBlackout = async () => {
    if (!startDate || !endDate) {
      toast.error("Veuillez renseigner la date de début et la date de fin.");
      return;
    }
    const token = getToken();
    if (!token) return;
    const t = toast.loading("Création de la période...");
    const res = await fetch("/api/leave-blackouts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title,
        reason,
        startDate,
        endDate,
        departmentId: departmentId === "ALL" ? null : departmentId,
      }),
    });
    if (res.ok) {
      toast.success("Période bloquée créée.", { id: t });
      setTitle("");
      setReason("");
      setStartDate("");
      setEndDate("");
      setDepartmentId("ALL");
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error || "Erreur lors de la creation.", { id: t });
    }
  };

  const removeBlackout = async (id: string) => {
    const token = getToken();
    if (!token) return;
    const t = toast.loading("Suppression...");
    const res = await fetch(`/api/leave-blackouts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast.success("Periode supprimee.", { id: t });
      setItems((prev) => prev.filter((x) => x.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error || "Erreur lors de la suppression.", { id: t });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="text-xl font-semibold text-vdm-gold-800">Periodes bloquees</div>
        <div className="text-sm text-vdm-gold-700">
          Le CEO peut bloquer certaines dates pour empecher les demandes de conge.
        </div>
      </div>

      <div className="bg-white border border-vdm-gold-200 rounded-xl p-4 grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Titre</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-2"
            placeholder="Ex: Inventaire annuel"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Departement</label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-2 bg-white"
          >
            {deptOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Date debut</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Date fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Motif</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-2"
            placeholder="Ex: periode chargee"
          />
        </div>
        <div className="md:col-span-2">
          <button
            onClick={createBlackout}
            className="px-3 py-2 rounded-md bg-vdm-gold-700 text-white text-sm hover:bg-vdm-gold-800"
          >
            Bloquer la periode
          </button>
        </div>
      </div>

      <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
        <div className="text-sm font-semibold text-vdm-gold-800 mb-3">Periodes actives</div>
        <div className="grid gap-2">
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">Aucune periode bloquee.</div>
          ) : (
            items.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-vdm-gold-100 rounded-lg p-3"
              >
                <div>
                  <div className="font-semibold text-vdm-gold-900">{b.title || "Periode bloquee"}</div>
                  <div className="text-xs text-vdm-gold-700">
                    {formatDateDMY(b.startDate)} - {formatDateDMY(b.endDate)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {b.department?.type ?? "ALL"} {b.reason ? `• ${b.reason}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => removeBlackout(b.id)}
                  className="px-2 py-1 rounded-md border border-red-300 text-red-600 text-xs hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
