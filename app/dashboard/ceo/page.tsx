import DashboardCharts from "@/app/components/DashboardCharts";

export default function CeoHome() {
  const lineData = [
    { name: "Jan", value: 4 },
    { name: "Fév", value: 6 },
    { name: "Mar", value: 3 },
    { name: "Avr", value: 7 },
    { name: "Mai", value: 5 },
    { name: "Juin", value: 8 },
  ];
  const pieData = [
    { name: "Validées", value: 9 },
    { name: "Refusées", value: 2 },
    { name: "En attente", value: 3 },
  ];
  const barData = [
    { name: "Escaladées", value: 6 },
    { name: "Décidées", value: 10 },
    { name: "Délai", value: 4 },
  ];
  return (
    <div className="p-6">
      <div className="text-xl font-semibold text-vdm-gold-800">Dashboard PDG</div>
      <div className="text-sm text-vdm-gold-700 mt-1">Décision finale sur les demandes escaladées.</div>

      <div className="grid gap-4 mt-6 md:grid-cols-3">
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Demandes escaladées</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
          <div className="text-xs text-gray-500 mt-2">À traiter en priorité.</div>
        </div>
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Décisions ce mois</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
          <div className="text-xs text-gray-500 mt-2">Total des validations/refus.</div>
        </div>
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Délais moyens</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
          <div className="text-xs text-gray-500 mt-2">Temps moyen de décision.</div>
        </div>
      </div>

      <DashboardCharts
        title="Vue PDG"
        subtitle="Décisions finales et escalades."
        lineData={lineData}
        pieData={pieData}
        barData={barData}
      />
    </div>
  );
}
