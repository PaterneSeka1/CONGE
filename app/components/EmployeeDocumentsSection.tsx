"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken, type EmployeeSession } from "@/lib/auth-client";
import toast from "react-hot-toast";

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
  updatedAt?: string;
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
  const [uploadOwnerDocuments, setUploadOwnerDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<DocumentType>("ID_CARD");
  const [editRelatedPersonName, setEditRelatedPersonName] = useState("");
  const [editChildOrder, setEditChildOrder] = useState("");
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editFileInputKey, setEditFileInputKey] = useState(0);
  const [isEditingBusy, setIsEditingBusy] = useState(false);
  const [deleteModalDoc, setDeleteModalDoc] = useState<EmployeeDocument | null>(null);

  const hasGlobalAccess = useMemo(() => canReadAll(employee.role), [employee.role]);
  const canUploadDocuments = employee.role !== "CEO";
  const isEditingChildType = editType === "CHILD_BIRTH_CERTIFICATE";
  const isEditingNeedsRelatedName =
    editType === "SPOUSE_BIRTH_CERTIFICATE" || editType === "CHILD_BIRTH_CERTIFICATE";

  const refreshDocuments = useCallback(async (signal?: AbortSignal) => {
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
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
      signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(String(data?.error ?? "Impossible de charger les documents"));
      setIsLoading(false);
      return;
    }
    setDocuments(Array.isArray(data?.documents) ? (data.documents as EmployeeDocument[]) : []);
    setIsLoading(false);
  }, [employee.id, hasGlobalAccess, selectedEmployeeId]);

  const refreshUploadOwnerDocuments = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const res = await fetch(`/api/employee-documents?employeeId=${employee.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const list = Array.isArray(data?.documents) ? (data.documents as EmployeeDocument[]) : [];
    setUploadOwnerDocuments(list);
  }, [employee.id]);

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
    const frame = window.requestAnimationFrame(() => {
      refreshDocuments(controller.signal).catch((e: unknown) => {
        if ((e as Error)?.name === "AbortError") return;
        toast.error("Impossible de charger les documents");
        setIsLoading(false);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      controller.abort();
    };
  }, [refreshDocuments]);

  useEffect(() => {
    if (!canUploadDocuments) return;
    const frame = window.requestAnimationFrame(() => {
      refreshUploadOwnerDocuments();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [canUploadDocuments, refreshUploadOwnerDocuments]);

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

  const uploadOwnerTypeSet = useMemo(() => {
    const set = new Set<string>();
    for (const doc of uploadOwnerDocuments) {
      if (doc.type === "CHILD_BIRTH_CERTIFICATE") continue;
      set.add(doc.type);
    }
    return set;
  }, [uploadOwnerDocuments]);

  const availableUploadTypes = useMemo(
    () =>
      DOCUMENT_TYPES.filter(
        (item) => item.value === "CHILD_BIRTH_CERTIFICATE" || !uploadOwnerTypeSet.has(item.value)
      ),
    [uploadOwnerTypeSet]
  );
  const effectiveSelectedType = useMemo(
    () =>
      availableUploadTypes.some((item) => item.value === selectedType)
        ? selectedType
        : (availableUploadTypes[0]?.value ?? "CHILD_BIRTH_CERTIFICATE"),
    [availableUploadTypes, selectedType]
  );
  const needsRelatedName =
    effectiveSelectedType === "SPOUSE_BIRTH_CERTIFICATE" || effectiveSelectedType === "CHILD_BIRTH_CERTIFICATE";
  const isChildType = effectiveSelectedType === "CHILD_BIRTH_CERTIFICATE";

  const uploadDocument = async () => {
    if (!canUploadDocuments) {
      toast.error("Le PDG ne peut pas ajouter de documents administratifs.");
      return;
    }
    const token = getToken();
    if (!token) return;
    if (!selectedFile) {
      toast.error("Sélectionnez un fichier avant l'envoi.");
      return;
    }

    setIsUploading(true);

    if (needsRelatedName && !relatedPersonName.trim()) {
      toast.error("Le nom du conjoint/enfant est obligatoire.");
      setIsUploading(false);
      return;
    }

    try {
      const fileDataUrl = await toDataUrl(selectedFile);
      if (!fileDataUrl) {
        toast.error("Fichier invalide.");
        setIsUploading(false);
        return;
      }

      const payload: Record<string, unknown> = {
        type: effectiveSelectedType,
        fileName: selectedFile.name,
        fileDataUrl,
      };
      if (needsRelatedName) {
        payload.relatedPersonName = relatedPersonName.trim();
      }
      if (isChildType && childOrder.trim()) {
        const parsedChildOrder = Number(childOrder.trim());
        if (!Number.isInteger(parsedChildOrder) || parsedChildOrder <= 0) {
          toast.error("Le rang de l'enfant doit être un entier positif.");
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
        toast.error(String(data?.error ?? "Erreur lors de l'envoi du document"));
        setIsUploading(false);
        return;
      }

      toast.success("Document ajouté avec succès.");
      setSelectedFile(null);
      setRelatedPersonName("");
      setChildOrder("");
      setFileInputKey((prev) => prev + 1);
      await refreshDocuments();
      await refreshUploadOwnerDocuments();
      setIsUploading(false);
    } catch {
      toast.error("Erreur lors de la lecture du fichier.");
      setIsUploading(false);
    }
  };

  const canManageDocument = (doc: EmployeeDocument) => {
    if (employee.role === "CEO") return false;
    if (employee.role === "ACCOUNTANT") return doc.employee?.role !== "CEO";
    return doc.employeeId === employee.id;
  };

  const startEditDocument = (doc: EmployeeDocument) => {
    setEditingId(doc.id);
    setEditType(doc.type);
    setEditRelatedPersonName(doc.relatedPersonName ?? "");
    setEditChildOrder(doc.childOrder ? String(doc.childOrder) : "");
    setEditSelectedFile(null);
    setEditFileInputKey((v) => v + 1);
  };

  const cancelEditDocument = () => {
    if (isEditingBusy) return;
    setEditingId(null);
    setEditSelectedFile(null);
    setEditRelatedPersonName("");
    setEditChildOrder("");
  };

  const saveEditDocument = async (doc: EmployeeDocument) => {
    const token = getToken();
    if (!token) return;

    setIsEditingBusy(true);
    try {
      const payload: Record<string, unknown> = {
        type: editType,
        relatedPersonName: isEditingNeedsRelatedName ? editRelatedPersonName.trim() : null,
      };

      if (isEditingNeedsRelatedName && !editRelatedPersonName.trim()) {
        toast.error("Le nom du conjoint/enfant est obligatoire.");
        setIsEditingBusy(false);
        return;
      }

      if (isEditingChildType && editChildOrder.trim()) {
        const parsedChildOrder = Number(editChildOrder.trim());
        if (!Number.isInteger(parsedChildOrder) || parsedChildOrder <= 0) {
          toast.error("Le rang de l'enfant doit être un entier positif.");
          setIsEditingBusy(false);
          return;
        }
        payload.childOrder = parsedChildOrder;
      } else {
        payload.childOrder = null;
      }

      if (editSelectedFile) {
        const fileDataUrl = await toDataUrl(editSelectedFile);
        if (!fileDataUrl) {
          toast.error("Fichier invalide.");
          setIsEditingBusy(false);
          return;
        }
        payload.fileName = editSelectedFile.name;
        payload.fileDataUrl = fileDataUrl;
      }

      const res = await fetch(`/api/employee-documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(String(data?.error ?? "Erreur lors de la modification du document"));
        setIsEditingBusy(false);
        return;
      }

      toast.success("Document modifié avec succès.");
      setEditingId(null);
      setEditSelectedFile(null);
      await refreshDocuments();
      await refreshUploadOwnerDocuments();
      setIsEditingBusy(false);
    } catch {
      toast.error("Erreur réseau lors de la modification.");
      setIsEditingBusy(false);
    }
  };

  const deleteDocument = async (doc: EmployeeDocument) => {
    setDeleteModalDoc(doc);
  };

  const confirmDeleteDocument = async () => {
    if (!deleteModalDoc) return;
    const token = getToken();
    if (!token) return;

    setIsEditingBusy(true);
    try {
      const res = await fetch(`/api/employee-documents/${deleteModalDoc.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(String(data?.error ?? "Erreur lors de la suppression du document"));
        setIsEditingBusy(false);
        return;
      }
      toast.success("Document supprimé.");
      if (editingId === deleteModalDoc.id) setEditingId(null);
      setDeleteModalDoc(null);
      await refreshDocuments();
      await refreshUploadOwnerDocuments();
      setIsEditingBusy(false);
    } catch {
      toast.error("Erreur réseau lors de la suppression.");
      setIsEditingBusy(false);
    }
  };


  const getEditTypeOptions = (doc: EmployeeDocument) => {
    const occupied = new Set(
      documents
        .filter((item) => item.employeeId === doc.employeeId && item.id !== doc.id && item.type !== "CHILD_BIRTH_CERTIFICATE")
        .map((item) => item.type)
    );
    return DOCUMENT_TYPES.filter(
      (item) =>
        item.value === "CHILD_BIRTH_CERTIFICATE" ||
        item.value === doc.type ||
        !occupied.has(item.value)
    );
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
                value={effectiveSelectedType}
                onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
              >
                {availableUploadTypes.map((item) => (
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
            disabled={isUploading || availableUploadTypes.length === 0}
            className="px-3 py-2 rounded-md bg-vdm-gold-700 text-white text-sm hover:bg-vdm-gold-800 disabled:opacity-60"
          >
            {isUploading ? "Envoi..." : "Ajouter le document"}
          </button>
          {availableUploadTypes.length === 0 ? (
            <div className="text-xs text-vdm-gold-700 mt-1">
              Tous les documents uniques sont déjà ajoutés. Seuls les extraits d&apos;enfant peuvent être multiples.
            </div>
          ) : null}
        </div>
      ) : null}

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
                <div className="flex flex-wrap gap-2">
                  <a
                    href={doc.fileDataUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={doc.fileName}
                    className="px-3 py-2 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-sm hover:bg-vdm-gold-50"
                  >
                    Ouvrir / Télécharger
                  </a>
                  {canManageDocument(doc) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditDocument(doc)}
                        className="px-3 py-2 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-sm hover:bg-vdm-gold-50"
                        disabled={isEditingBusy}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDocument(doc)}
                        className="px-3 py-2 rounded-md border border-red-300 text-red-700 text-sm hover:bg-red-50"
                        disabled={isEditingBusy}
                      >
                        Supprimer
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {editingId === doc.id ? (
                <div className="mt-3 border-t border-vdm-gold-100 pt-3 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs text-vdm-gold-600 mb-1">Type de document</div>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as DocumentType)}
                        className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                        disabled={isEditingBusy}
                      >
                        {getEditTypeOptions(doc).map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isEditingNeedsRelatedName ? (
                      <div>
                        <div className="text-xs text-vdm-gold-600 mb-1">
                          {isEditingChildType ? "Nom de l'enfant" : "Nom du conjoint"}
                        </div>
                        <input
                          value={editRelatedPersonName}
                          onChange={(e) => setEditRelatedPersonName(e.target.value)}
                          className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                          disabled={isEditingBusy}
                        />
                      </div>
                    ) : null}

                    {isEditingChildType ? (
                      <div>
                        <div className="text-xs text-vdm-gold-600 mb-1">Rang de l&apos;enfant (optionnel)</div>
                        <input
                          value={editChildOrder}
                          onChange={(e) => setEditChildOrder(e.target.value.replace(/\D/g, ""))}
                          className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                          disabled={isEditingBusy}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <div className="text-xs text-vdm-gold-600 mb-1">Remplacer le fichier (optionnel)</div>
                    <input
                      key={editFileInputKey}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => setEditSelectedFile(e.target.files?.[0] ?? null)}
                      className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500 bg-white"
                      disabled={isEditingBusy}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveEditDocument(doc)}
                      className="px-3 py-2 rounded-md bg-vdm-gold-700 text-white text-sm hover:bg-vdm-gold-800 disabled:opacity-60"
                      disabled={isEditingBusy}
                    >
                      {isEditingBusy ? "Enregistrement..." : "Enregistrer"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditDocument}
                      className="px-3 py-2 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-sm hover:bg-vdm-gold-50"
                      disabled={isEditingBusy}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : null}
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

      {deleteModalDoc ? (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white border border-vdm-gold-200 p-5">
            <div className="text-base font-semibold text-vdm-gold-900 mb-2">Confirmer la suppression</div>
            <div className="text-sm text-vdm-gold-700 mb-4">
              Voulez-vous vraiment supprimer ce document: <span className="font-semibold">{deleteModalDoc.fileName}</span> ?
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalDoc(null)}
                className="px-3 py-2 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-sm hover:bg-vdm-gold-50"
                disabled={isEditingBusy}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteDocument}
                className="px-3 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
                disabled={isEditingBusy}
              >
                {isEditingBusy ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
