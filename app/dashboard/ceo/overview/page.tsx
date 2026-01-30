"use client";

import { useEffect, useState } from "react";
import DashboardCharts from "@/app/components/DashboardCharts";
import { getToken } from "@/lib/auth-client";

type DeptCount = { departmentType: string; count: number };

export default function CeoOverview() {
  const lineData = [
    { name: "Jan", value: 6 },
    { name: "Fev", value: 8 },
    { name: "Mar", value: 5 },
    { name: "Avr", value: 10 },
    { name: "Mai", value: 7 },
    { name: "Juin", value: 9 },
  ];
  const pieData = [
    { name: "Validees", value: 14 },
    { name: "Refusees", value: 4 },
    { name: "En attente", value: 3 },
  ];
  const [barData, setBarData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const load = async () => {
      const res = await fetch("/api/leave-requests/vacation-counts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const counts = (data?.counts ?? []) as DeptCount[];
        setBarData(counts.map((c) => ({ name: c.departmentType, value: c.count })));
      }
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Vue globale</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Indicateurs consolides des demandes et decisions.
      </div>

      <DashboardCharts
        title="Vue globale"
        subtitle="Synthese multi-departements."
        lineData={lineData}
        pieData={pieData}
        barData={barData.length ? barData : [{ name: "Aucun", value: 0 }]}
      />
    </div>
  );
}
