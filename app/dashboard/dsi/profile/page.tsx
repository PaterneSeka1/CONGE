"use client";

import ProfileView from "@/app/components/ProfileView";
import { DEFAULT_DOCUMENT_TYPES } from "@/app/components/EmployeeDocumentsSection";

const DSI_PROFILE_DOCUMENT_TYPES = DEFAULT_DOCUMENT_TYPES.filter(
  (item) => item.value !== "CONTRACT"
);

export default function DsiProfilePage() {
  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Profil</div>
      <div className="text-sm text-vdm-gold-700 mb-4">Vos informations personnelles.</div>
      <ProfileView documentTypes={DSI_PROFILE_DOCUMENT_TYPES} />
    </div>
  );
}
