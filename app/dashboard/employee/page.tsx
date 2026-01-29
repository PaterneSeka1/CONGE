"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RequireAuth from "@/app/components/RequireAuth";
import RoleGate from "@/app/components/RoleGate";
import DashboardShell from "@/app/components/DashboardShell";
import DashboardCharts from "@/app/components/DashboardCharts";
import { getToken } from "@/lib/auth-client";

type LeaveItem = {
  id: string;
  startDate: string;
  endDate: string;
  status: "SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
};

const BASE_ALLOWANCE = 25;
const MONTHS = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sept", "Oct", "Nov", "Dec"];

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

function statusLabel(status: LeaveItem["status"]) {
  switch (status) {
    case "APPROVED":
      return "VALIDE";
    case "REJECTED":
      return "REFUSE";
    case "CANCELLED":
      return "ANNULE";
    default:
      return "EN ATTENTE";
  }
}

export default function EmployeeDashboard() {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [baseAllowance, setBaseAllowance] = useState<number>(BASE_ALLOWANCE);

  const refreshData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const res = await fetch("/api/leave-requests/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setLeaves(data?.leaves ?? []);
    const base = Number(data?.employee?.leaveBalance ?? BASE_ALLOWANCE);
    setBaseAllowance(Number.isFinite(base) ? base : BASE_ALLOWANCE);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      await refreshData();
    };
    load();
    const intervalId = setInterval(load, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    const onUpdated = () => load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("leave-requests-updated", onUpdated);
    return () => {
      active = false;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("leave-requests-updated", onUpdated);
    };
  }, [refreshData]);

  const stats = useMemo(() => {
    const year = new Date().getFullYear();
    const yearLeaves = leaves.filter((l) => {
      const d = new Date(l.createdAt);
      return !Number.isNaN(d.getTime()) && d.getUTCFullYear() === year;
    });

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let approvedDays = 0;

    const monthlyCounts = Array.from({ length: 12 }, () => 0);

    for (const leave of leaves) {
      if (leave.status === "PENDING" || leave.status === "SUBMITTED") pendingCount += 1;
      if (leave.status === "APPROVED") {
        approvedCount += 1;
        approvedDays += overlapDaysInYear(leave.startDate, leave.endDate, year);
      }
      if (leave.status === "REJECTED") rejectedCount += 1;
    }

    for (const leave of yearLeaves) {
      const d = new Date(leave.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      monthlyCounts[d.getUTCMonth()] += 1;
    }

    const consumedDays = consumedDaysForYear(leaves, year);
    const balance = Math.max(0, baseAllowance - consumedDays);

    const lineData = MONTHS.map((name, idx) => ({ name, value: monthlyCounts[idx] }));
    const pieData = [
      { name: "En attente", value: pendingCount },
      { name: "Validees", value: approvedCount },
      { name: "Refusees", value: rejectedCount },
    ];
    const barData = [
      { name: "Demandes", value: yearLeaves.length },
      { name: "Jours pris", value: consumedDays },
      { name: "Solde", value: balance },
    ];

    const last = leaves[0];
    const lastLabel = last
      ? `${statusLabel(last.status)} • ${last.startDate?.slice(0, 10)} -> ${last.endDate?.slice(0, 10)}`
      : "Aucune";

    return { balance, pendingCount, lastLabel, lineData, pieData, barData };
  }, [leaves, baseAllowance]);

  return (
    <RequireAuth>
      <RoleGate allow={["EMPLOYEE"]}>
        <DashboardShell title="Dashboard Employe">
          <div className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm text-vdm-gold-700">Solde conges</div>
                  <button
                    type="button"
                    onClick={refreshData}
                    className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
                  >
                    Rafraichir
                  </button>
                </div>
                <div className="text-3xl font-bold text-vdm-gold-800 mt-2">{stats.balance}</div>
                <div className="text-xs text-gray-500 mt-2">Base annuelle: {baseAllowance} jours.</div>
              </div>
              <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
                <div className="text-sm text-vdm-gold-700">Demandes en cours</div>
                <div className="text-3xl font-bold text-vdm-gold-800 mt-2">{stats.pendingCount}</div>
                <div className="text-xs text-gray-500 mt-2">En attente de validation.</div>
              </div>
              <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
                <div className="text-sm text-vdm-gold-700">Derniere demande</div>
                <div className="text-sm font-semibold text-vdm-gold-800 mt-3">{stats.lastLabel}</div>
                <div className="text-xs text-gray-500 mt-2">Statut et periode.</div>
              </div>
            </section>

            <DashboardCharts
              title="Mes statistiques"
              subtitle="Suivi de mes demandes de conge."
              lineData={stats.lineData}
              pieData={stats.pieData}
              barData={stats.barData}
            />
          </div>
        </DashboardShell>
      </RoleGate>
    </RequireAuth>
  );
}
