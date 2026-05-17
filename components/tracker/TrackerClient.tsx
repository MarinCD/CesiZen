"use client"

import { useState } from "react"
import { EmotionForm } from "./EmotionForm"
import { EmotionGraph } from "./EmotionGraph"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Activity } from "lucide-react"

interface Emotion {
  id: number
  emotion: string
  intensite: number
  note: string | null
  date: string
}

interface Props {
  initialEmotions: Emotion[]
}

export function TrackerClient({ initialEmotions }: Props) {
  const [emotions, setEmotions] = useState<Emotion[]>(initialEmotions)
  const [period, setPeriod] = useState<7 | 30>(30)

  const filtered = emotions.filter((e) => {
    const d = new Date(e.date)
    const limit = new Date()
    limit.setDate(limit.getDate() - period)
    return d >= limit
  })

  const reload = async () => {
    const res = await fetch(`/api/tracker?days=30`)
    const data = await res.json()
    setEmotions(data.map((e: any) => ({ ...e, date: new Date(e.date).toISOString() })))
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette entrée ?")) return
    await fetch(`/api/tracker/${id}`, { method: "DELETE" })
    setEmotions((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ajouter une émotion</CardTitle>
        </CardHeader>
        <CardContent>
          <EmotionForm onAdded={reload} />
        </CardContent>
      </Card>

      {/* Graphique */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Évolution</CardTitle>
            <div className="flex gap-2" role="group" aria-label="Période d'affichage">
              {([7, 30] as const).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={period === p ? "default" : "outline"}
                  onClick={() => setPeriod(p)}
                  aria-pressed={period === p}
                >
                  {p} jours
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" aria-hidden="true" />
              <p>Aucune entrée sur cette période.</p>
            </div>
          ) : (
            <EmotionGraph emotions={filtered} />
          )}
        </CardContent>
      </Card>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique ({filtered.length} entrées)</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune entrée.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((e) => (
                <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{e.emotion}</Badge>
                      <span className="text-sm text-muted-foreground">Intensité : {e.intensite}/5</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(e.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {e.note && <p className="text-sm text-muted-foreground mt-1">{e.note}</p>}
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    aria-label={`Supprimer l'entrée ${e.emotion}`}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
