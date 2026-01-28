"use client";

import { useState } from "react";

export default function DsiLeaveNew() {
  const [type, setType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [remainingTasks, setRemainingTasks] = useState("");

  const submit = async () => {
    if (!startDate || !endDate) {
      alert("Veuillez renseigner la date de début et la date de fin.");
      return;
    }
    // TODO: fetch POST /api/leaves
    alert("Demande prête (UI). Branche ensuite sur POST /api/leaves.");
  };

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Demander un congé</div>
      <div className="text-sm text-vdm-gold-700 mb-4">Soumettez votre demande.</div>

      <div className="bg-white border border-vdm-gold-200 rounded-xl p-4 grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
          >
            <option value="ANNUAL">Congé annuel</option>
            <option value="SICK">Maladie</option>
            <option value="UNPAID">Sans solde</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>

        <div />

        <div>
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Date début</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Date fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Motif (optionnel)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            placeholder="Ex: repos, raison familiale..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Tâches restantes</label>
          <textarea
            value={remainingTasks}
            onChange={(e) => setRemainingTasks(e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            rows={3}
            placeholder="Listez les tâches à terminer ou à passer à un collègue..."
          />
        </div>

        <div className="md:col-span-2">
          <button
            onClick={submit}
            className="px-3 py-2 rounded-md bg-vdm-gold-700 text-white text-sm hover:bg-vdm-gold-800"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
