"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

interface DataPoint {
  date: string
  score: number
  interpretation: string | null | undefined
}

export function HistoriqueChart({ data }: { data: DataPoint[] }) {
  if (data.length < 2) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Réalisez au moins 2 diagnostics pour voir l'évolution.
      </p>
    )
  }

  return (
    <div aria-label="Graphique d'évolution du score de stress" role="img">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, "auto"]} />
          <Tooltip
            formatter={(value: number) => [value + " pts", "Score"]}
            labelFormatter={(label) => `Date : ${label}`}
          />
          <ReferenceLine y={150} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "150", fontSize: 11, fill: "#f59e0b" }} />
          <ReferenceLine y={300} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "300", fontSize: 11, fill: "#ef4444" }} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 5, fill: "#3b82f6" }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Ligne orange = 150 pts (risque modéré) · Ligne rouge = 300 pts (risque élevé)
      </p>
    </div>
  )
}
