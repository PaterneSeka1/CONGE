"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SeriesPoint = { name: string; value: number };

export default function DashboardCharts({
  title,
  subtitle,
  barData,
  lineData,
  pieData,
}: {
  title: string;
  subtitle?: string;
  barData: SeriesPoint[];
  lineData: SeriesPoint[];
  pieData: SeriesPoint[];
}) {
  return (
    <section className="mt-6">
      <div className="mb-4">
        <div className="text-lg font-semibold text-vdm-gold-800">{title}</div>
        {subtitle ? <div className="text-sm text-vdm-gold-700">{subtitle}</div> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4 h-72">
          <div className="text-sm text-vdm-gold-700 mb-2">Évolution</div>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8c8" />
              <XAxis dataKey="name" stroke="#8a6a2f" />
              <YAxis stroke="#8a6a2f" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#b8892e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4 h-72">
          <div className="text-sm text-vdm-gold-700 mb-2">Répartition</div>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                outerRadius={75}
                fill="#b8892e"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-vdm-gold-200 rounded-xl p-4 h-72">
          <div className="text-sm text-vdm-gold-700 mb-2">Volumes</div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8c8" />
              <XAxis dataKey="name" stroke="#8a6a2f" />
              <YAxis stroke="#8a6a2f" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#d8b35a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
