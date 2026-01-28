import DashboardCharts from "@/app/components/DashboardCharts";

export default function ManagerHome() {
  const lineData = [
    { name: "Jan", value: 6 },
    { name: "Fév", value: 9 },
    { name: "Mar", value: 5 },
    { name: "Avr", value: 8 },
    { name: "Mai", value: 7 },
    { name: "Juin", value: 10 },
  ];
  const pieData = [
    { name: "En attente", value: 5 },
    { name: "Validées", value: 12 },
    { name: "Refusées", value: 3 },
  ];
  const barData = [
    { name: "À traiter", value: 7 },
    { name: "Transmises", value: 4 },
    { name: "Équipe", value: 12 },
  ];
  return (
    <div className="p-6">
      <div className="text-xl font-semibold text-vdm-gold-800">Dashboard Responsable</div>
      <div className="text-sm text-vdm-gold-700 mt-1">
        Demandes transmises à traiter pour ton département.
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-3">
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Demandes en attente</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
          <div className="text-xs text-gray-500 mt-2">À traiter cette semaine.</div>
        </div>
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Équipe</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
          <div className="text-xs text-gray-500 mt-2">Employés de ton département.</div>
        </div>
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Demandes transmises</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
          <div className="text-xs text-gray-500 mt-2">Vers comptable/CEO.</div>
        </div>
      </div>

      <DashboardCharts
        title="Vue Responsable"
        subtitle="Suivi du département."
        lineData={lineData}
        pieData={pieData}
        barData={barData}
      />
    </div>
  );
}
