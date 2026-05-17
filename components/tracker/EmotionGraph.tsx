"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useMemo } from "react"

interface Emotion {
  id: number
  emotion: string
  intensite: number
  note: string | null
  date: string
}

const EMOTION_COLORS: Record<string, string> = {
  Joie: "#f59e0b",
  Sérénité: "#10b981",
  Confiance: "#3b82f6",
  Anxiété: "#ef4444",
  Tristesse: "#6366f1",
  Colère: "#dc2626",
  Peur: "#7c3aed",
  Surprise: "#f97316",
  Dégoût: "#854d0e",
  Anticipation: "#0ea5e9",
  Fatigue: "#6b7280",
  Enthousiasme: "#d946ef",
}

interface Props {
  emotions: Emotion[]
}

export function EmotionGraph({ emotions }: Props) {
  const { chartData, emotionsList } = useMemo(() => {
    const dateMap: Record<string, Record<string, number[]>> = {}

    for (const e of emotions) {
      const date = new Date(e.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
      if (!dateMap[date]) dateMap[date] = {}
      if (!dateMap[date][e.emotion]) dateMap[date][e.emotion] = []
      dateMap[date][e.emotion].push(e.intensite)
    }

    const chartData = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, emotionMap]) => {
        const entry: Record<string, any> = { date }
        for (const [emotion, values] of Object.entries(emotionMap)) {
          entry[emotion] = Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
        }
        return entry
      })

    const emotionsList = Array.from(new Set(emotions.map((e) => e.emotion)))
    return { chartData, emotionsList }
  }, [emotions])

  if (emotions.length === 0) return null

  return (
    <div aria-label="Graphique d'évolution des émotions" role="img">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) => [`${value}/5`, name]}
            labelFormatter={(label) => `Date : ${label}`}
          />
          <Legend />
          {emotionsList.map((emotion) => (
            <Line
              key={emotion}
              type="monotone"
              dataKey={emotion}
              stroke={EMOTION_COLORS[emotion] || "#94a3b8"}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
