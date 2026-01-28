import RequireAuth from "@/app/components/RequireAuth";
import RoleGate from "@/app/components/RoleGate";
import DashboardShell from "@/app/components/DashboardShell";

export default function EmployeeDashboard() {
  return (
    <RequireAuth>
      <RoleGate allow={["EMPLOYEE"]}>
        <DashboardShell title="Dashboard Employé">
          <div className="grid gap-6">
            <section className="bg-white border rounded-xl p-4">
              <div className="font-semibold mb-2">Nouvelle demande de congé</div>
              <div className="text-sm text-gray-600 mb-4">
                (UI uniquement pour l’instant) Formulaire: type, startDate, endDate, reason.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="border rounded-md p-2" placeholder="Type (ANNUAL/SICK/...)" />
                <input className="border rounded-md p-2" placeholder="Date début (YYYY-MM-DD)" />
                <input className="border rounded-md p-2" placeholder="Date fin (YYYY-MM-DD)" />
                <input className="border rounded-md p-2" placeholder="Motif (optionnel)" />
              </div>
              <button className="mt-4 px-3 py-2 rounded-md bg-black text-white text-sm">
                Envoyer la demande
              </button>
            </section>

            <section className="bg-white border rounded-xl p-4">
              <div className="font-semibold mb-2">Mes demandes</div>
              <div className="text-sm text-gray-600">
                (UI) Table: période, statut, assigné à, actions (annuler si PENDING).
              </div>
            </section>
          </div>
        </DashboardShell>
      </RoleGate>
    </RequireAuth>
  );
}
