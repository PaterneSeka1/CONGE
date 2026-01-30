import DashboardCharts from "@/app/components/DashboardCharts";

export default function AccountantHome() {
  const lineData = [
    { name: "Jan", value: 14 },
    { name: "Fév", value: 10 },
    { name: "Mar", value: 18 },
    { name: "Avr", value: 9 },
    { name: "Mai", value: 16 },
    { name: "Juin", value: 12 },
  ];
  const pieData = [
    { name: "Validées", value: 22 },
    { name: "Refusées", value: 6 },
    { name: "Transmises CEO", value: 8 },
  ];
  const barData = [
    { name: "Demandes", value: 36 },
    { name: "Transmises", value: 8 },
    { name: "Décisions", value: 28 },
  ];

  return (
    <div className="p-6">
      <div className="text-xl font-semibold text-vdm-gold-800">Dashboard Comptable</div>
      <div className="text-sm text-vdm-gold-700 mt-1">
        Gestion des demandes de congé (validation, refus, transmission).
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-3">
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Demandes reçues</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
          <div className="text-xs text-gray-500 mt-2">Toutes les demandes à traiter.</div>
        </div>
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Transmises au CEO</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
          <div className="text-xs text-gray-500 mt-2">Demandes issues des responsables.</div>
        </div>
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Décisions prises</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
          <div className="text-xs text-gray-500 mt-2">Validations/refus ce mois.</div>
        </div>
      </div>

      <DashboardCharts
        title="Vue Comptable"
        subtitle="Demandes reçues et décisions."
        lineData={lineData}
        pieData={pieData}
        barData={barData}
      />
    </div>
  );
}
