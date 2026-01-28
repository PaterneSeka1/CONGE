"use client";

import { useEffect, useMemo, useState } from "react";
import { EmployeeSession, getEmployee } from "@/lib/auth-client";

type DsiEmployee = EmployeeSession & {
  leaveBalance?: number; // recommandé dans ton modèle
};

export default function DsiDashboard() {
  const employee = useMemo(() => getEmployee() as DsiEmployee | null, []);
  const [balance, setBalance] = useState<number>(25);

  useEffect(() => {
    // si ton backend renvoie leaveBalance, on l’affiche; sinon fallback 25
    if (employee?.leaveBalance != null) setBalance(employee.leaveBalance);
  }, [employee]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <div className="text-xl font-semibold text-vdm-gold-800">
          Bonjour {employee?.firstName ?? ""} {employee?.lastName ?? ""}
        </div>
        <div className="text-sm text-vdm-gold-700">Vous êtes connecté en tant que DSI (Admin).</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Solde de congé</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">{balance} jours</div>
          <div className="text-xs text-gray-500 mt-2">Initialisé à 25 (par défaut).</div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">À traiter</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
          <div className="text-xs text-gray-500 mt-2">Demandes transmises par la comptable.</div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-vdm-gold-700">Comptes en attente</div>
          <div className="text-3xl font-bold text-vdm-gold-800 mt-2">—</div>
          <div className="text-xs text-gray-500 mt-2">Validation des nouveaux employés.</div>
        </div>
      </div>
    </div>
  );
}

