import RequireAuth from "@/app/components/RequireAuth";
import RoleGate from "@/app/components/RoleGate";
import DashboardShell from "@/app/components/DashboardShell";
import DashboardCharts from "@/app/components/DashboardCharts";

export default function EmployeeDashboard() {
  const lineData = [
    { name: "Jan", value: 1 },
    { name: "Fév", value: 0 },
    { name: "Mar", value: 2 },
    { name: "Avr", value: 1 },
    { name: "Mai", value: 0 },
    { name: "Juin", value: 1 },
  ];
  const pieData = [
    { name: "En attente", value: 1 },
    { name: "Validées", value: 2 },
    { name: "Refusées", value: 0 },
  ];
  const barData = [
    { name: "Demandes", value: 3 },
    { name: "Jours pris", value: 8 },
    { name: "Solde", value: 12 },
  ];

  return (
    <RequireAuth>
      <RoleGate allow={["EMPLOYEE"]}>
        <DashboardShell title="Dashboard Employé">
          <div className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
                <div className="text-sm text-vdm-gold-700">Solde congés</div>
                <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
                <div className="text-xs text-gray-500 mt-2">À mettre à jour depuis l’API.</div>
              </div>
              <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
                <div className="text-sm text-vdm-gold-700">Demandes en cours</div>
                <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
                <div className="text-xs text-gray-500 mt-2">En attente de validation.</div>
              </div>
              <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
                <div className="text-sm text-vdm-gold-700">Dernière demande</div>
                <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
                <div className="text-xs text-gray-500 mt-2">Statut et période.</div>
              </div>
            </section>

            <DashboardCharts
              title="Mes statistiques"
              subtitle="Suivi de mes demandes de congé."
              lineData={lineData}
              pieData={pieData}
              barData={barData}
            />
          </div>
        </DashboardShell>
      </RoleGate>
    </RequireAuth>
  );
}

