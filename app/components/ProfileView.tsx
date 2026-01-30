"use client";

import { useEffect, useMemo, useState } from "react";
import { getEmployee, getToken } from "@/lib/auth-client";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import { adjacencyGraphs, dictionary as commonDictionary } from "@zxcvbn-ts/language-common";
import { dictionary as frDictionary } from "@zxcvbn-ts/language-fr";

zxcvbnOptions.setOptions({
  translations: frDictionary.translations,
  graphs: adjacencyGraphs,
  dictionary: {
    ...commonDictionary,
    ...frDictionary.dictionary,
  },
});

type EditableEmployee = ReturnType<typeof getEmployee> & {
  jobTitle?: string | null;
  phone?: string | null;
};

export default function ProfileView() {
  const employee = useMemo(() => getEmployee() as EditableEmployee | null, []);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<EditableEmployee | null>(employee);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [departmentNames, setDepartmentNames] = useState<Record<string, string>>({});

  const pw = useMemo(() => {
    const userInputs = [draft?.email, draft?.firstName, draft?.lastName].filter(Boolean);
    return zxcvbn(password, userInputs as string[]);
  }, [password, draft?.email, draft?.firstName, draft?.lastName]);

  useEffect(() => {
    const token = getToken();
    if (!token || !employee?.id) return;
    const load = async () => {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.employee) {
        const refreshed = { ...employee, ...data.employee };
        localStorage.setItem("employee", JSON.stringify(refreshed));
        setDraft(refreshed);
      }
    };
    load();
  }, [employee]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const loadDepartments = async () => {
      const res = await fetch("/api/departments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const map: Record<string, string> = {};
        (data?.departments ?? []).forEach((d: any) => {
          map[d.id] = d.name ?? d.type ?? d.id;
        });
        setDepartmentNames(map);
      }
    };
    loadDepartments();
  }, []);

  if (!employee || !draft) {
    return (
      <div className="bg-white border border-vdm-gold-200 rounded-xl p-4">
        <div className="text-sm text-vdm-gold-700">Aucune session trouvée.</div>
      </div>
    );
  }

  const cancelEdit = () => {
    setDraft(employee);
    setPassword("");
    setPasswordError(null);
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (password) {
      if (password.length < 6) {
        setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }
      if (pw.score < 2) {
        setPasswordError("Mot de passe trop faible. Renforcez-le avant de continuer.");
        return;
      }
    }
    setPasswordError(null);
    const token = getToken();
    if (!token) return;

    const payload: Record<string, unknown> = {
      firstName: draft.firstName,
      lastName: draft.lastName,
      jobTitle: draft.jobTitle ?? null,
    };
    if (password) payload.password = password;

    const res = await fetch(`/api/auth/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const updated = data?.employee ? { ...draft, ...data.employee } : { ...draft };
      localStorage.setItem("employee", JSON.stringify(updated));
      setPassword("");
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white border border-vdm-gold-200 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-lg font-semibold text-vdm-gold-800">Informations du compte</div>
          <div className="text-sm text-vdm-gold-700">Mettez à jour vos informations personnelles.</div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-2 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-sm hover:bg-vdm-gold-50"
          >
            Modifier
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="px-3 py-2 rounded-md bg-vdm-gold-700 text-white text-sm hover:bg-vdm-gold-800"
            >
              Enregistrer
            </button>
            <button
              onClick={cancelEdit}
              className="px-3 py-2 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-sm hover:bg-vdm-gold-50"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-xs text-vdm-gold-600">Prénom</div>
          {isEditing ? (
            <input
              value={draft.firstName}
              onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
              className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            />
          ) : (
            <div className="text-sm text-vdm-gold-900 font-medium">{draft.firstName}</div>
          )}
        </div>
        <div>
          <div className="text-xs text-vdm-gold-600">Nom</div>
          {isEditing ? (
            <input
              value={draft.lastName}
              onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
              className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            />
          ) : (
            <div className="text-sm text-vdm-gold-900 font-medium">{draft.lastName}</div>
          )}
        </div>
        <div>
          <div className="text-xs text-vdm-gold-600">Email</div>
          <div className="text-sm text-vdm-gold-900 font-medium">{draft.email}</div>
        </div>
        <div>
          <div className="text-xs text-vdm-gold-600">Matricule</div>
          <div className="text-sm text-vdm-gold-900 font-medium">{draft.matricule ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs text-vdm-gold-600">Poste</div>
          {isEditing ? (
            <input
              value={draft.jobTitle ?? ""}
              onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
              className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            />
          ) : (
            <div className="text-sm text-vdm-gold-900 font-medium">{draft.jobTitle ?? "—"}</div>
          )}
        </div>
        <div>
          <div className="text-xs text-vdm-gold-600">Téléphone</div>
          {isEditing ? (
            <input
              value={draft.phone ?? ""}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            />
          ) : (
            <div className="text-sm text-vdm-gold-900 font-medium">{draft.phone ?? "—"}</div>
          )}
        </div>
        <div>
          <div className="text-xs text-vdm-gold-600">Rôle</div>
          <div className="text-sm text-vdm-gold-900 font-medium">{draft.role}</div>
        </div>
        <div>
          <div className="text-xs text-vdm-gold-600">Statut</div>
          <div className="text-sm text-vdm-gold-900 font-medium">{draft.status}</div>
        </div>
        <div>
          <div className="text-xs text-vdm-gold-600">Département</div>
          <div className="text-sm text-vdm-gold-900 font-medium">
            {draft.departmentId
              ? departmentNames[draft.departmentId] ?? draft.departmentId
              : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-vdm-gold-600">Service</div>
          <div className="text-sm text-vdm-gold-900 font-medium">{draft.serviceId ?? "—"}</div>
        </div>
        {isEditing ? (
          <div className="md:col-span-2">
            <div className="text-xs text-vdm-gold-600">Mot de passe</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              className="w-full border border-vdm-gold-200 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            />
            <div className="mt-2">
              <div className="h-2 w-full rounded-full bg-vdm-gold-200 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-vdm-gold-700 transition-all"
                  style={{ width: `${Math.round((Math.min(Math.max(pw.score, 0), 4) / 4) * 100)}%` }}
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-semibold">
                {["très faible", "faible", "moyenne", "bonne", "très bonne"][pw.score] ?? "—"}
              </span>
            </div>
            {passwordError ? <div className="mt-2 text-xs text-red-600">{passwordError}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
