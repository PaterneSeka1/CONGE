"use client";

import { useMemo } from "react";
import { getEmployee } from "@/lib/auth-client";
import ContractDocumentTypeManager from "@/app/components/ContractDocumentTypeManager";
import { useContractDocumentTypes } from "@/app/hooks/useContractDocumentTypes";
import ContractDocumentsSection from "@/app/components/ContractDocumentsSection";

export default function AccountantEmployeeContractsPage() {
  const employee = useMemo(() => getEmployee(), []);
  const { contractDocumentTypes, refreshContractDocumentTypes, isContractDocumentTypesLoading } =
    useContractDocumentTypes();

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Contrats des employés</div>
        <p className="text-sm text-vdm-gold-700">
          Consultez et classez les contrats déposés pour chaque collaborateur. Les documents personnels restent dans
          Profil.
        </p>
      </div>
      {employee ? (
        <>
          <ContractDocumentTypeManager
            contractDocumentTypes={contractDocumentTypes}
            onRefresh={refreshContractDocumentTypes}
          />
          <ContractDocumentsSection
            employee={employee}
            contractDocumentTypes={contractDocumentTypes}
            isContractDocumentTypesLoading={isContractDocumentTypesLoading}
          />
        </>
      ) : (
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4 text-sm text-vdm-gold-700">
          Aucune session active.
        </div>
      )}
    </div>
  );
}
