"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateDMY } from "@/lib/date-format";
import { getToken } from "@/lib/auth-client";
import toast from "react-hot-toast";

function toLocalDateInputValue(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toUtcDay(value: string | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function buildMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startWeekday = (first.getDay() + 6) % 7; 
  const daysInMonth = last.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return { year, month, cells };
}

function toDateValueForDay(year: number, month: number, day: number) {
  return toLocalDateInputValue(new Date(year, month, day));
}

export default function OperationsPurchaseNew() {
  const [name, setName] = useState("");
  const [items, setItems] = useState<Array<{ name: string; amount: string }>>([{ name: "", amount: "" }]);
  const [date, setDate] = useState("");
  const today = useMemo(() => toLocalDateInputValue(new Date()), []);
  const todayUtc = useMemo(() => toUtcDay(toLocalDateInputValue(new Date())), []);
  const [current, setCurrent] = useState(() => new Date());
  const { year, month, cells } = useMemo(() => buildMonth(current), [current]);
  const monthLabel = formatDateDMY(new Date(current.getFullYear(), current.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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

  useEffect(() => {
    if (!date) {
      setSelectedDay(null);
      return;
    }
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return;
    setCurrent(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDay(d.getDate());
  }, [date]);

  const submit = async () => {
    if (!name || !date) {
      toast.error("Veuillez renseigner le nom et la date.");
      return;
    }
    if (date < today) {
      toast.error("La date d'achat doit etre aujourd'hui ou future.");
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

  const goPrev = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const isToday = (day: number | null) => {
    if (!day) return false;
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
  };

  const isPastDay = (day: number | null) => {
    if (!day || todayUtc == null) return false;
    return Date.UTC(year, month, day) < todayUtc;
  };

  const handleCalendarSelect = (day: number | null) => {
    if (!day || isPastDay(day)) return;
    setSelectedDay(day);
    setDate(toDateValueForDay(year, month, day));
  };

  return (
    <div className="p-6">
      <div className="text-xl font-semibold mb-1 text-vdm-gold-800">Nouvelle demande d'achat futur</div>
      <div className="text-sm text-vdm-gold-700 mb-4">
        Soumettez une demande d'achat futur a la comptable.
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
            min={today}
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

        <div className="md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-vdm-gold-800">Calendrier des achats</div>
              <div className="text-xs text-vdm-gold-600">
                Selectionnez une date (aujourd'hui ou future).
              </div>
            </div>
            <div className="text-xs text-vdm-gold-700 capitalize">{monthLabel}</div>
          </div>

          <div className="flex items-center justify-between mt-3 mb-2">
            <button
              onClick={goPrev}
              className="px-2 py-1 rounded-md border border-vdm-gold-200 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
              type="button"
            >
              Prec
            </button>
            <div className="text-xs text-gray-500">{year}</div>
            <button
              onClick={goNext}
              className="px-2 py-1 rounded-md border border-vdm-gold-200 text-vdm-gold-800 text-xs hover:bg-vdm-gold-50"
              type="button"
            >
              Suiv
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs text-center text-vdm-gold-700 mb-2">
            {"L M M J V S D".split(" ").map((d, i) => (
              <div key={`${d}-${i}`} className="py-1 font-semibold">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {cells.map((day, idx) => {
              const past = isPastDay(day);
              const dateValue = day != null ? toDateValueForDay(year, month, day) : "";
              const isSelected = !!day && dateValue === date;
              return (
                <button
                  key={`${day ?? "x"}-${idx}`}
                  type="button"
                  onClick={() => handleCalendarSelect(day)}
                  className={`h-9 flex items-center justify-center rounded-md text-sm ${
                    day ? "text-vdm-gold-900" : "text-transparent"
                  } ${
                    isSelected
                      ? "bg-vdm-gold-700 text-white font-semibold"
                      : isToday(day)
                        ? "bg-vdm-gold-200 font-semibold"
                        : "hover:bg-vdm-gold-50"
                  } ${past ? "bg-vdm-gold-50/70 text-vdm-gold-400" : ""} ${
                    day && !past ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  {day ?? "-"}
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-vdm-gold-700">
            Date choisie: {date ? formatDateDMY(date) : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
