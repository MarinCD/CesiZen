"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

const EMOTIONS = [
  "Joie", "Sérénité", "Confiance", "Anxiété",
  "Tristesse", "Colère", "Peur", "Surprise",
  "Dégoût", "Anticipation", "Fatigue", "Enthousiasme",
]

interface Props {
  onAdded: () => void
}

export function EmotionForm({ onAdded }: Props) {
  const [emotion, setEmotion] = useState("")
  const [intensite, setIntensite] = useState(3)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emotion) { setError("Veuillez choisir une émotion."); return }
    setError("")
    setLoading(true)

    const res = await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emotion, intensite, note }),
    })

    setLoading(false)
    if (res.ok) {
      setEmotion("")
      setIntensite(3)
      setNote("")
      onAdded()
    } else {
      setError("Erreur lors de l'enregistrement.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      )}

      {/* Émotion */}
      <div className="space-y-2">
        <Label>Comment vous sentez-vous ?</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Choisir une émotion">
          {EMOTIONS.map((e) => (
            <button
              key={e}
              type="button"
              role="radio"
              aria-checked={emotion === e}
              onClick={() => setEmotion(e)}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                emotion === e
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Intensité */}
      <div className="space-y-2">
        <Label htmlFor="intensite">
          Intensité : <strong>{intensite}/5</strong>
        </Label>
        <input
          id="intensite"
          type="range"
          min={1}
          max={5}
          step={1}
          value={intensite}
          onChange={(e) => setIntensite(parseInt(e.target.value))}
          className="w-full accent-primary"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={intensite}
          aria-valuetext={`${intensite} sur 5`}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Légère</span>
          <span>Intense</span>
        </div>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="note">Note (optionnelle)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Décrivez ce que vous ressentez..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        {loading ? "Enregistrement..." : "Ajouter cette entrée"}
      </Button>
    </form>
  )
}
