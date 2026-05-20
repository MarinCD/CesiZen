"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"

interface Reponse {
  texte: string
  valeur: number
}

interface Question {
  texte: string
  pointsAssocies: number
  reponses: Reponse[]
  expanded: boolean
}

export function QuestionnaireForm() {
  const router = useRouter()
  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [diagnosticNom, setDiagnosticNom] = useState("")
  const [questions, setQuestions] = useState<Question[]>([
    { texte: "", pointsAssocies: 0, reponses: [], expanded: true },
  ])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const addQuestion = () =>
    setQuestions((q) => [...q, { texte: "", pointsAssocies: 0, reponses: [], expanded: true }])

  const removeQuestion = (i: number) =>
    setQuestions((q) => q.filter((_, idx) => idx !== i))

  const updateQuestion = (i: number, field: keyof Question, value: any) =>
    setQuestions((q) => q.map((qq, idx) => (idx === i ? { ...qq, [field]: value } : qq)))

  const addReponse = (qi: number) =>
    setQuestions((q) =>
      q.map((qq, idx) =>
        idx === qi ? { ...qq, reponses: [...qq.reponses, { texte: "", valeur: 0 }] } : qq
      )
    )

  const removeReponse = (qi: number, ri: number) =>
    setQuestions((q) =>
      q.map((qq, idx) =>
        idx === qi ? { ...qq, reponses: qq.reponses.filter((_, r) => r !== ri) } : qq
      )
    )

  const updateReponse = (qi: number, ri: number, field: keyof Reponse, value: any) =>
    setQuestions((q) =>
      q.map((qq, idx) =>
        idx === qi
          ? {
              ...qq,
              reponses: qq.reponses.map((rr, r) => (r === ri ? { ...rr, [field]: value } : rr)),
            }
          : qq
      )
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      titre,
      description: description || undefined,
      diagnosticNom,
      questions: questions.map((q) => ({
        texte: q.texte,
        pointsAssocies: Number(q.pointsAssocies),
        reponses: q.reponses.length > 0
          ? q.reponses.map((r) => ({ texte: r.texte, valeur: Number(r.valeur) }))
          : undefined,
      })),
    }

    const res = await fetch("/api/questionnaires", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (res.ok) {
      router.push("/admin/questionnaires")
      router.refresh()
    } else {
      const data = await res.json()
      setError(typeof data.error === "string" ? data.error : "Erreur lors de la création")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-4 p-5 rounded-lg border bg-gray-50">
        <h2 className="font-semibold text-gray-900">Informations générales</h2>

        <div className="space-y-2">
          <Label htmlFor="titre">Titre du questionnaire *</Label>
          <Input
            id="titre"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            required
            minLength={3}
            placeholder="Ex: Évaluation du niveau de stress"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description du questionnaire"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnosticNom">Nom du diagnostic associé *</Label>
          <Input
            id="diagnosticNom"
            value={diagnosticNom}
            onChange={(e) => setDiagnosticNom(e.target.value)}
            required
            minLength={2}
            placeholder="Ex: Holmes & Rahe"
          />
          <p className="text-xs text-muted-foreground">
            Un diagnostic est créé automatiquement à partir de ce questionnaire.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Questions ({questions.length})</h2>
          <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter une question
          </Button>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="space-y-3 p-4 rounded-lg border">
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-muted-foreground mt-2 w-6">{qi + 1}.</span>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`q-${qi}-texte`} className="text-xs">Texte de la question *</Label>
                    <Input
                      id={`q-${qi}-texte`}
                      value={q.texte}
                      onChange={(e) => updateQuestion(qi, "texte", e.target.value)}
                      required
                      minLength={3}
                      placeholder="Ex: Décès d'un proche"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`q-${qi}-points`} className="text-xs">Points associés *</Label>
                    <Input
                      id={`q-${qi}-points`}
                      type="number"
                      min={0}
                      value={q.pointsAssocies}
                      onChange={(e) => updateQuestion(qi, "pointsAssocies", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(qi, "expanded", !q.expanded)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {q.expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Réponses possibles ({q.reponses.length}) — optionnel
                  </button>

                  {q.expanded && (
                    <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                      {q.reponses.map((r, ri) => (
                        <div key={ri} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_auto] gap-2">
                          <Input
                            value={r.texte}
                            onChange={(e) => updateReponse(qi, ri, "texte", e.target.value)}
                            placeholder="Texte de la réponse"
                            required
                          />
                          <Input
                            type="number"
                            value={r.valeur}
                            onChange={(e) => updateReponse(qi, ri, "valeur", e.target.value)}
                            placeholder="Valeur"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeReponse(qi, ri)}
                            aria-label="Supprimer la réponse"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="ghost" size="sm" onClick={() => addReponse(qi)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter une réponse
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {questions.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(qi)}
                  aria-label={`Supprimer la question ${qi + 1}`}
                  className="text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer le questionnaire"}
        </Button>
      </div>
    </form>
  )
}
