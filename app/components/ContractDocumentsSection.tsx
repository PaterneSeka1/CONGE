"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getToken, type EmployeeSession } from "@/lib/auth-client";
import toast from "react-hot-toast";
import { type ContractDocumentType } from "@/app/hooks/useContractDocumentTypes";

const ALL_EMPLOYEES_VALUE = "__ALL__";

type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
  matricule?: string | null;
  email: string;
  role?: string;
};

type ContractDocument = {
  id: string;
  employeeId: string;
  fileName: string;
  createdAt: string;
  mimeType: string;
  contractDocumentType?: ContractDocumentType | null;
  employee?: EmployeeOption;
};

function employeeLabel(employee?: EmployeeOption) {
  if (!employee) return "Employé";
  const fullName = `${employee.firstName} ${employee.lastName}`.trim();
  if (employee.matricule) return `${fullName} (${employee.matricule})`;
  return fullName || employee.email;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

type Props = {
  employee: EmployeeSession;
  contractDocumentTypes: ContractDocumentType[];
  isContractDocumentTypesLoading?: boolean;
  showUploader?: boolean;
  showEmployeeFilter?: boolean;
};

export default function ContractDocumentsSection({
  employee,
  contractDocumentTypes,
  isContractDocumentTypesLoading = false,
  showUploader = true,
  showEmployeeFilter = true,
}: Props) {
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>(ALL_EMPLOYEES_VALUE);
  const [uploadEmployeeId, setUploadEmployeeId] = useState(employee.id);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedContractDocumentTypeId, setSelectedContractDocumentTypeId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);
  useEffect(() => {
    if (contractDocumentTypes.length === 0) {
      setSelectedContractDocumentTypeId("");
      return;
    }
    setSelectedContractDocumentTypeId((prev) =>
      contractDocumentTypes.some((type) => type.id === prev) ? prev : contractDocumentTypes[0].id
    );
  }, [contractDocumentTypes]);

  useEffect(() => {
    if (!showEmployeeFilter && !showUploader) return;
    const token = getToken();
    if (!token) return;

    const loadEmployees = async () => {
      const res = await fetch("/api/employees/options?take=150", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const list = Array.isArray(data?.employees) ? (data.employees as EmployeeOption[]) : [];
      const filtered = list.filter((item) => item.role !== "CEO");
      setEmployees(filtered);
      setUploadEmployeeId((prev) => (filtered.some((item) => item.id === prev) ? prev : filtered[0]?.id ?? employee.id));
    };

    loadEmployees();
  }, [employee.id, showEmployeeFilter, showUploader]);

  const fetchDocuments = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", "CONTRACT");
      if (filterEmployeeId !== ALL_EMPLOYEES_VALUE) {
        params.set("employeeId", filterEmployeeId);
      }
      const url = `/api/employee-documents?${params.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(String(data?.error ?? "Impossible de charger les contrats"));
        return;
      }
      setDocuments(Array.isArray(data?.documents) ? (data.documents as ContractDocument[]) : []);
    } catch (error) {
      toast.error("Erreur réseau lors du chargement des contrats");
    } finally {
      setIsLoading(false);
    }
  }, [filterEmployeeId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const groupedDocuments = useMemo(() => {
    const buckets = new Map<string, ContractDocument[]>();
    for (const doc of documents) {
      const key = doc.contractDocumentType?.name ?? "Sans catégorie";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(doc);
    }
    const result: Array<{ label: string; documents: ContractDocument[] }> = [];
    for (const [label, docs] of buckets.entries()) {
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      result.push({ label, documents: docs });
    }
    result.sort((a, b) => a.label.localeCompare(b.label));
    return result;
  }, [documents]);

  const uploadDocument = async () => {
    if (!selectedFile) {
      toast.error("Sélectionnez un fichier.");
      return;
    }
    if (!uploadEmployeeId) {
      toast.error("Sélectionnez un employé pour ce contrat.");
      return;
    }
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
        reader.readAsDataURL(selectedFile);
      });
      const token = getToken();
      if (!token) return;
      const payload: Record<string, unknown> = {
        type: "CONTRACT",
        fileName: selectedFile.name,
        fileDataUrl: dataUrl,
        employeeId: uploadEmployeeId,
        contractDocumentTypeId: selectedContractDocumentTypeId || null,
      };
      const res = await fetch("/api/employee-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(String(data?.error ?? "Erreur lors de l'envoi"));
        return;
      }
      toast.success("Document contractuel ajouté.");
      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
      fetchDocuments();
    } catch (error) {
      toast.error("Erreur lors de la lecture du fichier.");
    } finally {
      setIsUploading(false);
    }
  };

  const openDocument = async (doc: ContractDocument) => {
    const token = getToken();
    if (!token) return;
    setOpeningDocId(doc.id);
    try {
      const res = await fetch(`/api/employee-documents/${doc.id}/file`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(String(data?.error ?? "Impossible d'ouvrir le document"));
        setOpeningDocId(null);
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = doc.fileName;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } finally {
      setOpeningDocId(null);
    }
  };

  return (
    <div className="bg-white border border-vdm-gold-200 rounded-xl p-6 space-y-6">
      <div>
        <div className="text-lg font-semibold text-vdm-gold-800">Documents RH</div>
        <p className="text-sm text-vdm-gold-700">Envoyez ici les contrats et avenants par employé.</p>
      </div>

      {(showEmployeeFilter || showUploader) && (
        <div className="space-y-3">
          {showEmployeeFilter && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs text-vdm-gold-600 mb-1">Afficher les documents de</div>
                <select
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                  className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                >
                  <option value={ALL_EMPLOYEES_VALUE}>Tous les employés</option>
                  {employees.map((item) => (
                    <option key={item.id} value={item.id}>
                      {employeeLabel(item)}
                    </option>
                  ))}
                </select>
              </div>
              {showUploader ? (
                <div>
                  <div className="text-xs text-vdm-gold-600 mb-1">Ajouter pour l'employé</div>
                  <select
                    value={uploadEmployeeId}
                    onChange={(e) => setUploadEmployeeId(e.target.value)}
                    className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                  >
                    {employees.map((item) => (
                      <option key={item.id} value={item.id}>
                        {employeeLabel(item)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          )}
          {showUploader && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs text-vdm-gold-600 mb-1">Catégorie du contrat</div>
                <select
                  value={selectedContractDocumentTypeId}
                  onChange={(e) => setSelectedContractDocumentTypeId(e.target.value)}
                  disabled={isContractDocumentTypesLoading}
                  className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                >
                  <option value="">Sans catégorie</option>
                  {contractDocumentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs text-vdm-gold-600 mb-1">Fichier (PDF ou image)</div>
                <input
                  key={fileInputKey}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500 bg-white"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {showUploader ? (
        <div>
          <button
            type="button"
            onClick={uploadDocument}
            disabled={isUploading || !selectedFile || !uploadEmployeeId}
            className="px-3 py-2 rounded-md bg-vdm-gold-700 text-white text-sm hover:bg-vdm-gold-800 disabled:opacity-60"
          >
            {isUploading ? "Envoi..." : "Ajouter le document"}
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-vdm-gold-700">Chargement des documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-sm text-vdm-gold-700">Aucun document pour le moment.</div>
        ) : (
          groupedDocuments.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-vdm-gold-800">{group.label}</div>
                <div className="text-xs text-vdm-gold-600">{group.documents.length} document(s)</div>
              </div>
              <div className="space-y-3">
                {group.documents.map((doc) => (
                  <div key={doc.id} className="border border-vdm-gold-200 rounded-md p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-vdm-gold-900">{doc.fileName}</div>
                        <div className="text-xs text-vdm-gold-700">
                          {employeeLabel(doc.employee)} · ajouté le {formatDate(doc.createdAt)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openDocument(doc)}
                        disabled={openingDocId === doc.id}
                        className="px-3 py-1 rounded-md border border-vdm-gold-300 text-xs text-vdm-gold-800 hover:bg-vdm-gold-50"
                      >
                        {openingDocId === doc.id ? "Ouverture..." : "Ouvrir"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
