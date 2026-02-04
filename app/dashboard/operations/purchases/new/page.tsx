"use client";

import { useMemo, useState } from "react";
import { getToken } from "@/lib/auth-client";
import toast from "react-hot-toast";

function toLocalDateInputValue(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function OperationsPurchaseNew() {
  const [name, setName] = useState("");
  const [items, setItems] = useState<Array<{ name: string; amount: string }>>([{ name: "", amount: "" }]);
  const [date, setDate] = useState("");
  const today = useMemo(() => toLocalDateInputValue(new Date()), []);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const value = Number(item.amount);
      return Number.isFinite(value) && value > 0 ? sum + value : sum;
    }, 0);
  }, [items]);

  const updateItem = (index: number, patch: Partial<{ name: string; amount: string }>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { name: "", amount: "" }]);

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!name || !date) {
      toast.error("Veuillez renseigner le nom et la date.");
      return;
    }
    const cleanItems = items
      .map((item) => ({
        name: item.name.trim(),
        amount: Number(item.amount),
      }))
      .filter((item) => item.name && Number.isFinite(item.amount) && item.amount > 0);
    if (cleanItems.length === 0) {
      toast.error("Ajoutez au moins un article valide.");
      return;
    }

    const token = getToken();
    if (!token) return;
    const t = toast.loading("Envoi en cours...");
    try {
      const res = await fetch("/api/purchase-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, items: cleanItems, date }),
      });
      if (res.ok) {
        toast.success("Demande envoyee.", { id: t });
        setName("");
        setItems([{ name: "", amount: "" }]);
        setDate("");
        window.dispatchEvent(new Event("purchase-requests-updated"));
      } else {
        toast.error("Erreur lors de l'envoi.", { id: t });
      }
    } catch {
      toast.error("Erreur reseau lors de l'envoi.", { id: t });
    }
  };

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Nouvelle demande d'achat</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Soumettez une demande d'achat a la comptable.
      </div>

      <div className="bg-white border border-vdm-gold-200 rounded-xl p-4 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Nom de la demande</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-vdm-gold-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
            placeholder="Ex: Achat materiel informatique"
          />
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Articles</label>
            <button
              type="button"
              onClick={addItem}
              className="px-2 py-1 rounded-md border border-vdm-gold-300 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
            >
              Ajouter
            </button>
          </div>
          <div className="grid gap-2">
            {items.map((item, index) => (
              <div key={`item-${index}`} className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  className="w-full border border-vdm-gold-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                  placeholder="Ex: Imprimante"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) => updateItem(index, { amount: e.target.value })}
                  className="w-full border border-vdm-gold-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="px-2 py-1 rounded-md border border-vdm-gold-200 text-xs text-vdm-gold-700 hover:bg-vdm-gold-50 disabled:opacity-50"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-vdm-gold-700">
            Total: {total.toLocaleString("fr-FR")}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-vdm-gold-800 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className="w-full border border-vdm-gold-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-vdm-gold-500"
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
