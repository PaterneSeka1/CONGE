"use client";

import { useMemo } from "react";
import { getEmployee } from "@/lib/auth-client";
import EmployeeDocumentsSection from "@/app/components/EmployeeDocumentsSection";

export default function AccountantAdministrationContractsPage() {
  const employee = useMemo(() => getEmployee(), []);

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Mes contrats</div>
      <p className="text-sm text-vdm-gold-700 mb-6">
        La comptable peut déposer ici tous les documents RH additionnels (ex: contrats, avenants, attestations) pour
        les employés. Les documents personnels restent accessibles dans leur profil.
      </p>
      {employee ? (
        <EmployeeDocumentsSection employee={employee} scope="employees" />
      ) : (
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4 text-sm text-vdm-gold-700">
          Aucune session active.
        </div>
      )}
    </div>
  );
}
