"use client";

import { useEffect, useMemo, useState } from "react";
import { getToken, type EmployeeSession } from "@/lib/auth-client";

const DOCUMENT_TYPES = [
  { value: "ID_CARD", label: "CNI" },
  { value: "BIRTH_CERTIFICATE", label: "Extrait de naissance" },
  { value: "SPOUSE_BIRTH_CERTIFICATE", label: "Extrait du conjoint" },
  { value: "CHILD_BIRTH_CERTIFICATE", label: "Extrait d'un enfant" },
  { value: "CURRICULUM_VITAE", label: "Curriculum Vitae (CV)" },
  { value: "COVER_LETTER", label: "Lettre de motivation" },
  { value: "GEOGRAPHIC_LOCATION", label: "Situation géographique" },
] as const;

type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
  matricule?: string | null;
  email: string;
  role?: string;
  profilePhotoUrl?: string | null;
};

type EmployeeDocument = {
  id: string;
  employeeId: string;
  type: DocumentType;
  relatedPersonName?: string | null;
  childOrder?: number | null;
  fileName: string;
  mimeType: string;
  fileDataUrl: string;
  createdAt: string;
  employee?: EmployeeOption;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
};

const ALL_EMPLOYEES_VALUE = "__ALL__";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function typeLabel(type: string) {
  return DOCUMENT_TYPES.find((item) => item.value === type)?.label ?? type;
}

function employeeLabel(employee?: EmployeeOption) {
  if (!employee) return "Employé";
  const fullName = `${employee.firstName} ${employee.lastName}`.trim();
  if (employee.matricule) return `${fullName} (${employee.matricule})`;
  return fullName || employee.email;
}

function canReadAll(role?: string | null) {
  return role === "CEO" || role === "ACCOUNTANT";
}

async function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });
}

type Props = {
  employee: EmployeeSession;
};

export default function EmployeeDocumentsSection({ employee }: Props) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    canReadAll(employee.role) ? ALL_EMPLOYEES_VALUE : employee.id
  );
  const [selectedType, setSelectedType] = useState<DocumentType>("ID_CARD");
  const [relatedPersonName, setRelatedPersonName] = useState("");
  const [childOrder, setChildOrder] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoPreviewLabel, setPhotoPreviewLabel] = useState<string>("Photo de profil");

  const hasGlobalAccess = useMemo(() => canReadAll(employee.role), [employee.role]);
  const canUploadDocuments = employee.role !== "CEO";
  const needsRelatedName = selectedType === "SPOUSE_BIRTH_CERTIFICATE" || selectedType === "CHILD_BIRTH_CERTIFICATE";
  const isChildType = selectedType === "CHILD_BIRTH_CERTIFICATE";

  useEffect(() => {
    if (!hasGlobalAccess) return;
    const token = getToken();
    if (!token) return;

    const loadEmployees = async () => {
      const res = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const list = Array.isArray(data?.employees) ? (data.employees as EmployeeOption[]) : [];
      setEmployees(list.filter((item) => item.role !== "CEO"));
    };

    loadEmployees();
  }, [hasGlobalAccess]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const controller = new AbortController();
    const loadDocuments = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (hasGlobalAccess && selectedEmployeeId !== ALL_EMPLOYEES_VALUE) {
        params.set("employeeId", selectedEmployeeId);
      }
      if (!hasGlobalAccess) {
        params.set("employeeId", employee.id);
      }

      const query = params.toString();
      const url = query ? `/api/employee-documents?${query}` : "/api/employee-documents";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data?.error ?? "Impossible de charger les documents"));
        setIsLoading(false);
        return;
      }
      setDocuments(Array.isArray(data?.documents) ? (data.documents as EmployeeDocument[]) : []);
      setIsLoading(false);
    };

    loadDocuments().catch((e: unknown) => {
      if ((e as Error)?.name === "AbortError") return;
      setError("Impossible de charger les documents");
      setIsLoading(false);
    });

    return () => controller.abort();
  }, [employee.id, hasGlobalAccess, selectedEmployeeId]);

  useEffect(() => {
    if (!photoPreviewUrl) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPhotoPreviewUrl(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [photoPreviewUrl]);

  const uploadDocument = async () => {
    if (!canUploadDocuments) {
      setError("Le PDG ne peut pas ajouter de documents administratifs.");
      return;
    }
    const token = getToken();
    if (!token) return;
    if (!selectedFile) {
      setError("Sélectionnez un fichier avant l'envoi.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    if (needsRelatedName && !relatedPersonName.trim()) {
      setError("Le nom du conjoint/enfant est obligatoire.");
      setIsUploading(false);
      return;
    }

    try {
      const fileDataUrl = await toDataUrl(selectedFile);
      if (!fileDataUrl) {
        setError("Fichier invalide.");
        setIsUploading(false);
        return;
      }

      const payload: Record<string, unknown> = {
        type: selectedType,
        fileName: selectedFile.name,
        fileDataUrl,
      };
      if (needsRelatedName) {
        payload.relatedPersonName = relatedPersonName.trim();
      }
      if (isChildType && childOrder.trim()) {
        const parsedChildOrder = Number(childOrder.trim());
        if (!Number.isInteger(parsedChildOrder) || parsedChildOrder <= 0) {
          setError("Le rang de l'enfant doit être un entier positif.");
          setIsUploading(false);
          return;
        }
        payload.childOrder = parsedChildOrder;
      }

      const res = await fetch("/api/employee-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data?.error ?? "Erreur lors de l'envoi du document"));
        setIsUploading(false);
        return;
      }

      setSuccess("Document ajouté avec succès.");
      setSelectedFile(null);
      setRelatedPersonName("");
      setChildOrder("");
      setFileInputKey((prev) => prev + 1);

      const params = new URLSearchParams();
      if (hasGlobalAccess && selectedEmployeeId !== ALL_EMPLOYEES_VALUE) {
        params.set("employeeId", selectedEmployeeId);
      }
      if (!hasGlobalAccess) {
        params.set("employeeId", employee.id);
      }
      const query = params.toString();
      const refreshUrl = query ? `/api/employee-documents?${query}` : "/api/employee-documents";
      const refreshRes = await fetch(refreshUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (refreshRes.ok) {
        setDocuments(Array.isArray(refreshData?.documents) ? (refreshData.documents as EmployeeDocument[]) : []);
      }
      setIsUploading(false);
    } catch {
      setError("Erreur lors de la lecture du fichier.");
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-vdm-gold-200 rounded-xl p-6 mt-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-lg font-semibold text-vdm-gold-800">Documents RH</div>
          <div className="text-sm text-vdm-gold-700">
            Ajoutez et consultez vos documents administratifs (CNI, extraits, CV, lettre, situation géographique).
          </div>
          {!canUploadDocuments ? (
            <div className="text-xs text-vdm-gold-700 mt-1">
              Mode lecture seule: vous pouvez consulter et télécharger les documents de tous les employés.
            </div>
          ) : hasGlobalAccess ? (
            <div className="text-xs text-vdm-gold-700 mt-1">
              Vous pouvez consulter tous les documents, mais vous ne pouvez ajouter que vos propres documents.
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 mb-4">
        {hasGlobalAccess ? (
          <div className="md:col-span-3 grid gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs text-vdm-gold-600 mb-1">Afficher les documents de</div>
              <select
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
                }}
                className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
              >
                <option value={ALL_EMPLOYEES_VALUE}>Tous les employés</option>
                {employee.role !== "CEO" ? (
                  <option value={employee.id}>{employee.firstName} {employee.lastName} (moi)</option>
                ) : null}
                {employees
                  .filter((item) => item.id !== employee.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {employeeLabel(item)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ) : null}

        {canUploadDocuments ? (
          <>
            <div>
              <div className="text-xs text-vdm-gold-600 mb-1">Type de document</div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
              >
                {DOCUMENT_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {needsRelatedName ? (
              <div>
                <div className="text-xs text-vdm-gold-600 mb-1">
                  {isChildType ? "Nom de l'enfant" : "Nom du conjoint"}
                </div>
                <input
                  value={relatedPersonName}
                  onChange={(e) => setRelatedPersonName(e.target.value)}
                  placeholder={isChildType ? "Ex: KOUAME Sara" : "Ex: YAO Marie"}
                  className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                />
              </div>
            ) : null}

            {isChildType ? (
              <div>
                <div className="text-xs text-vdm-gold-600 mb-1">Rang de l&apos;enfant (optionnel)</div>
                <input
                  value={childOrder}
                  onChange={(e) => setChildOrder(e.target.value.replace(/\D/g, ""))}
                  placeholder="1"
                  inputMode="numeric"
                  className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                />
              </div>
            ) : null}

            <div className={needsRelatedName || isChildType ? "md:col-span-3" : "md:col-span-2"}>
              <div className="text-xs text-vdm-gold-600 mb-1">Fichier (PDF ou image)</div>
              <input
                key={fileInputKey}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500 bg-white"
              />
            </div>
          </>
        ) : null}
      </div>

      {canUploadDocuments ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={uploadDocument}
            disabled={isUploading}
            className="px-3 py-2 rounded-md bg-vdm-gold-700 text-white text-sm hover:bg-vdm-gold-800 disabled:opacity-60"
          >
            {isUploading ? "Envoi..." : "Ajouter le document"}
          </button>
        </div>
      ) : null}

      {error ? <div className="mb-3 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mb-3 text-sm text-green-700">{success}</div> : null}

      {isLoading ? (
        <div className="text-sm text-vdm-gold-700">Chargement des documents...</div>
      ) : documents.length === 0 ? (
        <div className="text-sm text-vdm-gold-700">Aucun document pour le moment.</div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="border border-vdm-gold-200 rounded-md p-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-start gap-3">
                  {doc.employee?.profilePhotoUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreviewUrl(doc.employee?.profilePhotoUrl ?? null);
                        setPhotoPreviewLabel(`Photo de ${employeeLabel(doc.employee)}`);
                      }}
                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                      aria-label={`Agrandir la photo de ${employeeLabel(doc.employee)}`}
                    >
                      <img
                        src={doc.employee.profilePhotoUrl}
                        alt={`Photo de ${employeeLabel(doc.employee)}`}
                        className="h-10 w-10 rounded-full object-cover border border-vdm-gold-200 cursor-zoom-in"
                      />
                    </button>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-vdm-gold-100 text-vdm-gold-800 border border-vdm-gold-200 flex items-center justify-center text-xs font-semibold">
                      {(doc.employee?.firstName?.[0] ?? "").toUpperCase()}
                      {(doc.employee?.lastName?.[0] ?? "").toUpperCase()}
                    </div>
                  )}
                  <div>
                  <div className="text-sm font-semibold text-vdm-gold-900">{typeLabel(doc.type)}</div>
                  <div className="text-xs text-vdm-gold-700">
                    Fichier: {doc.fileName} | Ajouté le: {formatDate(doc.createdAt)}
                  </div>
                  {doc.relatedPersonName ? (
                    <div className="text-xs text-vdm-gold-700">
                      {doc.type === "CHILD_BIRTH_CERTIFICATE" ? "Enfant" : "Conjoint"}: {doc.relatedPersonName}
                      {doc.type === "CHILD_BIRTH_CERTIFICATE" && doc.childOrder ? ` (rang ${doc.childOrder})` : ""}
                    </div>
                  ) : null}
                  {hasGlobalAccess ? (
                    <div className="text-xs text-vdm-gold-700">
                      Employé: {employeeLabel(doc.employee)} | Déposé par: {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName}
                    </div>
                  ) : null}
                </div>
                </div>
                <div>
                  <a
                    href={doc.fileDataUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={doc.fileName}
                    className="px-3 py-2 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-sm hover:bg-vdm-gold-50"
                  >
                    Ouvrir / Télécharger
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {photoPreviewUrl ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPhotoPreviewUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de la photo de profil"
        >
          <div
            className="relative w-full max-w-3xl rounded-xl overflow-hidden bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPhotoPreviewUrl(null)}
              className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs text-vdm-gold-900 border border-vdm-gold-200 hover:bg-white"
            >
              Fermer
            </button>
            <img
              src={photoPreviewUrl}
              alt={photoPreviewLabel}
              className="w-full max-h-[85vh] object-contain bg-black"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
