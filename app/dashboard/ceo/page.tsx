"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardCharts from "@/app/components/DashboardCharts";
import { getToken } from "@/lib/auth-client";

type CalendarLeave = {
  startDate: string;
  endDate: string;
  employee?: {
    firstName?: string;
    lastName?: string;
    matricule?: string;
    department?: { type?: string; name?: string };
  };
};

type CalendarBlackout = { startDate: string; endDate: string };

type CeoMetrics = {
  escalatedPending: number;
  decisionsThisMonth: number;
  avgDecisionDelayDays: number | null;
};

function buildMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startWeekday = (first.getDay() + 6) % 7; // lundi=0
  const daysInMonth = last.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return { year, month, cells };
}

function toUtcDateValue(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function inRange(day: number, month: number, year: number, start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
  const dUtc = Date.UTC(year, month, day);
  const sUtc = toUtcDateValue(s);
  const eUtc = toUtcDateValue(e);
  return dUtc >= sUtc && dUtc <= eUtc;
}

export default function CeoHome() {
  const lineData = [
    { name: "Jan", value: 4 },
    { name: "Fev", value: 6 },
    { name: "Mar", value: 3 },
    { name: "Avr", value: 7 },
    { name: "Mai", value: 5 },
    { name: "Juin", value: 8 },
  ];
  const pieData = [
    { name: "Validees", value: 9 },
    { name: "Refusees", value: 2 },
    { name: "En attente", value: 3 },
  ];
  const [metrics, setMetrics] = useState<CeoMetrics | null>(null);

  const barData = [
    { name: "Escaladees", value: metrics?.escalatedPending ?? 0 },
    { name: "Decidees", value: metrics?.decisionsThisMonth ?? 0 },
    { name: "Delai", value: metrics?.avgDecisionDelayDays ? Number(metrics.avgDecisionDelayDays.toFixed(1)) : 0 },
  ];

  const [current, setCurrent] = useState(() => new Date());
  const { year, month, cells } = useMemo(() => buildMonth(current), [current]);
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    current
  );

  const [approvedLeaves, setApprovedLeaves] = useState<CalendarLeave[]>([]);
  const [blackouts, setBlackouts] = useState<CalendarBlackout[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const formatAvgDelay = (value: number | null | undefined) => {
    if (value == null) return "—";
    return `${value.toFixed(1)} j`;
  };

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const load = async () => {
      const res = await fetch("/api/leave-requests/calendar", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setApprovedLeaves(data?.leaves ?? []);
        setBlackouts(data?.blackouts ?? []);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const load = async () => {
      const res = await fetch("/api/leave-requests/ceo-metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMetrics({
          escalatedPending: Number(data?.escalatedPending ?? 0),
          decisionsThisMonth: Number(data?.decisionsThisMonth ?? 0),
          avgDecisionDelayDays:
            typeof data?.avgDecisionDelayDays === "number" ? data.avgDecisionDelayDays : null,
        });
      }
    };
    load();
  }, []);

  const goPrev = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const today = new Date();
  const isToday = (day: number | null) =>
    day &&
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const isPast = (day: number | null) =>
    day &&
    Date.UTC(year, month, day) <
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  const hasLeave = (day: number | null) =>
    day && approvedLeaves.some((l) => inRange(day, month, year, l.startDate, l.endDate));

  const hasBlackout = (day: number | null) =>
    day && blackouts.some((b) => inRange(day, month, year, b.startDate, b.endDate));

  const selectedDateLabel =
    selectedDay != null
      ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(
          new Date(year, month, selectedDay)
        )
      : "";

  const details = useMemo(() => {
    if (selectedDay == null) return { leaves: [], blackouts: [] };
    const leaves = approvedLeaves.filter((l) => inRange(selectedDay, month, year, l.startDate, l.endDate));
    const blk = blackouts.filter((b) => inRange(selectedDay, month, year, b.startDate, b.endDate));
    return { leaves, blackouts: blk };
  }, [approvedLeaves, blackouts, selectedDay, month, year]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="text-xl font-semibold text-vdm-gold-800">Dashboard PDG</div>
        <div className="text-sm text-vdm-gold-700 mt-1">Decision finale sur les demandes escaladees.</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Demandes escaladees</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">
            {metrics?.escalatedPending ?? "—"}
          </div>
          <div className="text-xs text-gray-500 mt-2">A traiter en priorite.</div>
        </div>
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Decisions ce mois</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">
            {metrics?.decisionsThisMonth ?? "—"}
          </div>
          <div className="text-xs text-gray-500 mt-2">Total des validations/refus.</div>
        </div>
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Delais moyens</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">
            {formatAvgDelay(metrics?.avgDecisionDelayDays)}
          </div>
          <div className="text-xs text-gray-500 mt-2">Temps moyen de decision.</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCharts
            title="Vue PDG"
            subtitle="Decisions finales et escalades."
            lineData={lineData}
            pieData={pieData}
            barData={barData}
          />
        </div>

        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-vdm-gold-800">Calendrier</div>
            <div className="text-xs text-vdm-gold-700 capitalize">{monthLabel}</div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goPrev}
              className="px-2 py-1 rounded-md border border-vdm-gold-200 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
            >
              Prec
            </button>
            <div className="text-xs text-gray-500">{year}</div>
            <button
              onClick={goNext}
              className="px-2 py-1 rounded-md border border-vdm-gold-200 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
            >
              Suiv
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs text-center text-vdm-gold-700 mb-2">
            {"L M M J V S D".split(" ").map((d, i) => (
              <div key={`${d}-${i}`} className="py-1 font-semibold">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {cells.map((day, idx) => {
              const leave = hasLeave(day);
              const blackout = hasBlackout(day);
              return (
                <div
                  key={`${day ?? "x"}-${idx}`}
                  onClick={() => (day ? setSelectedDay(day) : null)}
                  className={`h-9 flex flex-col items-center justify-center rounded-md text-sm ${
                    day ? "text-vdm-gold-900" : "text-transparent"
                  } ${
                    isToday(day)
                      ? "bg-vdm-gold-200 font-semibold"
                      : "hover:bg-vdm-gold-50"
                  } ${isPast(day) ? "bg-vdm-gold-50/70" : ""} ${
                    blackout ? "bg-red-100 text-red-900" : ""
                  } ${day ? "cursor-pointer" : ""}`}
                >
                  <div className="leading-none">{day ?? "—"}</div>
                  <div className="mt-1 flex gap-1">
                    {leave ? <span className="h-1.5 w-1.5 rounded-full bg-vdm-gold-700" /> : null}
                    {blackout ? <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-vdm-gold-700" />
              Conges approuves
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Periodes bloquees
            </div>
          </div>
        </div>
      </div>

      {selectedDay != null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedDay(null)} />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <div className="text-lg font-semibold text-vdm-gold-800">Details du jour</div>
            <div className="text-sm text-vdm-gold-700 mt-1">{selectedDateLabel}</div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm font-semibold text-vdm-gold-800">Conges approuves</div>
                <div className="text-xs text-gray-500">Demandeurs: {details.leaves.length}</div>
                {details.leaves.length === 0 ? (
                  <div className="text-sm text-gray-500 mt-1">Aucun conge approuve.</div>
                ) : (
                  <ul className="mt-2 text-sm text-gray-700 space-y-2">
                    {details.leaves.map((l, i) => (
                      <li key={`${l.startDate}-${l.endDate}-${i}`}>
                        <div className="font-medium">
                          {(l.employee?.firstName ?? "") + " " + (l.employee?.lastName ?? "")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(l.employee?.matricule ?? "—") + " · "}
                          {(l.employee?.department?.type ?? l.employee?.department?.name ?? "—") + " · "}
                          {l.startDate?.slice(0, 10)} → {l.endDate?.slice(0, 10)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {details.leaves.length > 0 ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-xs text-left border border-vdm-gold-100 rounded-lg overflow-hidden">
                      <thead className="bg-vdm-gold-50 text-vdm-gold-900">
                        <tr>
                          <th className="px-2 py-1 border-b border-vdm-gold-100">Nom & prenoms</th>
                          <th className="px-2 py-1 border-b border-vdm-gold-100">Matricule</th>
                          <th className="px-2 py-1 border-b border-vdm-gold-100">Departement</th>
                          <th className="px-2 py-1 border-b border-vdm-gold-100">Periode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.leaves.map((l, i) => (
                          <tr key={`row-${l.startDate}-${l.endDate}-${i}`} className="odd:bg-white even:bg-vdm-gold-50/40">
                            <td className="px-2 py-1 border-b border-vdm-gold-100">
                              {`${l.employee?.firstName ?? ""} ${l.employee?.lastName ?? ""}`.trim() || "—"}
                            </td>
                            <td className="px-2 py-1 border-b border-vdm-gold-100">{l.employee?.matricule ?? "—"}</td>
                            <td className="px-2 py-1 border-b border-vdm-gold-100">
                              {l.employee?.department?.type ?? l.employee?.department?.name ?? "—"}
                            </td>
                            <td className="px-2 py-1 border-b border-vdm-gold-100">
                              {l.startDate?.slice(0, 10)} → {l.endDate?.slice(0, 10)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>

              <div>
                <div className="text-sm font-semibold text-vdm-gold-800">Periodes bloquees</div>
                {details.blackouts.length === 0 ? (
                  <div className="text-sm text-gray-500 mt-1">Aucune periode bloquee.</div>
                ) : (
                  <ul className="mt-2 text-sm text-gray-700 space-y-1">
                    {details.blackouts.map((b, i) => (
                      <li key={`${b.startDate}-${b.endDate}-${i}`}>
                        {b.startDate?.slice(0, 10)} → {b.endDate?.slice(0, 10)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-3 py-2 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-sm hover:bg-vdm-gold-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
