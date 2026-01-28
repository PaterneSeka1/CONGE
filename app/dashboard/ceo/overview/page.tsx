"use client";

import DashboardCharts from "@/app/components/DashboardCharts";

export default function CeoOverview() {
  const lineData = [
    { name: "Jan", value: 6 },
    { name: "Fév", value: 8 },
    { name: "Mar", value: 5 },
    { name: "Avr", value: 10 },
    { name: "Mai", value: 7 },
    { name: "Juin", value: 9 },
  ];
  const pieData = [
    { name: "Validées", value: 14 },
    { name: "Refusées", value: 4 },
    { name: "En attente", value: 3 },
  ];
  const barData = [
    { name: "DSI", value: 8 },
    { name: "DAF", value: 6 },
    { name: "OTHERS", value: 7 },
  ];

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Vue globale</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Indicateurs consolidés des demandes et décisions.
      </div>

      <DashboardCharts
        title="Vue globale"
        subtitle="Synthèse multi-départements."
        lineData={lineData}
        pieData={pieData}
        barData={barData}
      />
    </div>
  );
}
