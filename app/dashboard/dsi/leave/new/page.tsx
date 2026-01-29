"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth-client";
import toast from "react-hot-toast";

type LeaveItem = {
  startDate: string;
  endDate: string;
  status: "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
};

const BASE_ALLOWANCE = 25;

function toLocalDateInputValue(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toUtcDay(value: string | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function overlapDaysInYear(start: string, end: string, year: number) {
  const startUtc = toUtcDay(start);
  const endUtc = toUtcDay(end);
  if (startUtc == null || endUtc == null) return 0;
  if (endUtc < startUtc) return 0;
  const yearStart = Date.UTC(year, 0, 1);
  const yearEnd = Date.UTC(year, 11, 31);
  const s = Math.max(startUtc, yearStart);
  const e = Math.min(endUtc, yearEnd);
  if (s > e) return 0;
  return Math.floor((e - s) / 86400000) + 1;
}

function consumedDaysForYear(leaves: LeaveItem[], year: number) {
  let total = 0;
  for (const leave of leaves) {
    if (leave.status === "APPROVED" || leave.status === "PENDING" || leave.status === "SUBMITTED") {
      total += overlapDaysInYear(leave.startDate, leave.endDate, year);
    }
  }
  return total;
}

function daysBetweenInclusive(start: string, end: string) {
  const s = toUtcDay(start);
  const e = toUtcDay(end);
  if (s == null || e == null) return 0;
  if (e < s) return 0;
  return Math.floor((e - s) / 86400000) + 1;
}

function addDaysToDateInput(value: string, days: number) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  d.setDate(d.getDate() + days);
  return toLocalDateInputValue(d);
}

export default function DsiLeaveNew() {
  const [type, setType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [baseAllowance, setBaseAllowance] = useState<number>(BASE_ALLOWANCE);
  const [balance, setBalance] = useState<number>(BASE_ALLOWANCE);
  const today = useMemo(() => toLocalDateInputValue(new Date()), []);
  const daysRequested = useMemo(
    () => (startDate && endDate ? daysBetweenInclusive(startDate, endDate) : 0),
    [startDate, endDate]
  );
  const isExhausted = balance <= 0;

  const refreshBalance = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const res = await fetch("/api/leave-requests/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const leaves = (data?.leaves ?? []) as LeaveItem[];
    const base = Number(data?.employee?.leaveBalance ?? BASE_ALLOWANCE);
    const year = new Date().getFullYear();
    const consumedDays = consumedDaysForYear(leaves, year);
    setBaseAllowance(base);
    setBalance(Math.max(0, base - consumedDays));
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      await refreshBalance();
    };
    load();
    const intervalId = setInterval(load, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshBalance]);

  const submit = async () => {
    if (isExhausted) {
      toast.error("Solde de conges epuise.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Veuillez renseigner la date de debut et la date de fin.");
      return;
    }
    const daysRequested = daysBetweenInclusive(startDate, endDate);
    if (daysRequested <= 1) {
      toast.error("La periode saisie est invalide (minimum 2 jours).");
      return;
    }
    if (daysRequested > balance) {
      toast.error("La demande depasse votre solde de conges.");
      return;
    }

    const token = getToken();
    if (!token) return;
    const t = toast.loading("Envoi en cours...");
    try {
      const res = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type,
          startDate,
          endDate,
          reason,
        }),
      });
      if (res.ok) {
        toast.success("Demande envoyee. En attente de validation.", { id: t });
        setStartDate("");
        setEndDate("");
        setReason("");
        setType("ANNUAL");
        refreshBalance();
        window.dispatchEvent(new Event("leave-requests-updated"));
      } else {
        toast.error("Erreur lors de l'envoi.", { id: t });
      }
    } catch {
      toast.error("Erreur reseau lors de l'envoi.", { id: t });
    }
  };

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Demander un conge</div>
      <div className="text-sm text-vdm-gold-700 mb-4">Soumettez votre demande.</div>

      <div className="bg-white border border-vdm-gold-200 rounded-xl p-4 grid gap-3 md:grid-cols-2">
        {isExhausted ? (
          <div className="md:col-span-2 text-sm text-red-600">
            Votre solde de conges est epuise. Impossible de soumettre une nouvelle demande.
          </div>
        ) : null}
        <div>
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isExhausted}
            className="w-full border border-vdm-gold-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
          >
            <option value="ANNUAL">Conge annuel</option>
            <option value="SICK">Maladie</option>
            <option value="UNPAID">Sans solde</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>

        <div className="flex items-end justify-between gap-2 text-sm text-vdm-gold-700">
          <div>Solde: {balance} / {baseAllowance} jours</div>
          <button
            type="button"
            onClick={refreshBalance}
            className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
          >
            Rafraichir
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Date debut</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={today}
            disabled={isExhausted}
            className="w-full border border-vdm-gold-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Date fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate ? addDaysToDateInput(startDate, 1) : today}
            disabled={isExhausted}
            className="w-full border border-vdm-gold-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
          />
        </div>

        <div className="md:col-span-2">
          <div className="text-xs text-vdm-gold-700">
            {daysRequested > 0
              ? `Duree selectionnee: ${daysRequested} jour${daysRequested > 1 ? "s" : ""}`
              : "Selectionnez des dates pour calculer la duree."}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Motif (optionnel)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isExhausted}
            className="w-full border border-vdm-gold-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            placeholder="Ex: repos, raison familiale..."
          />
        </div>

        <div className="md:col-span-2">
          <button
            onClick={submit}
            disabled={isExhausted}
            className="px-3 py-2 rounded-md bg-vdm-gold-700 text-white text-sm hover:bg-vdm-gold-800"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
