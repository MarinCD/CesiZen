"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckSquare, Square, ChevronLeft, ChevronRight, Send, ShieldAlert } from "lucide-react"
import Link from "next/link"

// Le barème n'est pas transmis au navigateur : le score est calculé côté
// serveur à partir des identifiants de questions cochées.
interface Question {
  id: number
  texte: string
}

interface Props {
  diagnosticId: number
  questions: Question[]
}

export function QuestionnaireForm({ diagnosticId, questions }: Props) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)

  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE)
  const pageQuestions = questions.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
  const progress = ((currentPage + 1) / totalPages) * 100

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    const res = await fetch("/api/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diagnosticId, questionIds: Array.from(selected) }),
    })
    const data = await res.json()
    setLoading(false)

    const params = new URLSearchParams({
      score: String(data.score),
      interpretation: data.interpretation,
      saved: String(data.saved ?? false),
    })
    router.push(`/diagnostic/resultat?${params.toString()}`)
  }

  if (!consentGiven) {
    return (
      <div className="space-y-5 p-5 rounded-lg border bg-amber-50/50 border-amber-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-2">
            <h2 className="font-semibold text-gray-900">Avant de commencer</h2>
            <p className="text-sm text-muted-foreground">
              Ce questionnaire porte sur des événements de vie et peut révéler des informations sur
              votre niveau de stress. Vos réponses servent uniquement à calculer un résultat
              indicatif. Elles ne sont pas enregistrées telles quelles.
            </p>
            <p className="text-sm text-muted-foreground">
              Si vous êtes connecté et que l'historique est disponible, le score et son
              interprétation peuvent être ajoutés à votre compte. Consultez la{" "}
              <Link href="/confidentialite" className="underline hover:text-foreground">
                politique de confidentialité
              </Link>{" "}
              pour plus de détails.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <span>
            J'accepte le traitement de mes réponses pour calculer mon résultat et, si cette fonction
            est disponible, enregistrer ce résultat dans mon historique.
          </span>
        </label>

        <Button onClick={() => setConsentGiven(true)} disabled={!consent}>
          Commencer le diagnostic
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Page {currentPage + 1} sur {totalPages}</span>
          <span>{selected.size} événement{selected.size > 1 ? "s" : ""} coché{selected.size > 1 ? "s" : ""}</span>
        </div>
        <Progress value={progress} aria-label={`Progression : ${Math.round(progress)}%`} />
      </div>

      <div className="space-y-3" role="group" aria-label="Événements de vie">
        {pageQuestions.map((question) => {
          const isSelected = selected.has(question.id)
          return (
            <button
              key={question.id}
              onClick={() => toggle(question.id)}
              aria-pressed={isSelected}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-primary flex-shrink-0" aria-hidden="true">
                  {isSelected
                    ? <CheckSquare className="h-5 w-5" />
                    : <Square className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{question.texte}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Précédent
        </Button>

        {currentPage < totalPages - 1 ? (
          <Button onClick={() => setCurrentPage((p) => p + 1)}>
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            <Send className="h-4 w-4 mr-2" aria-hidden="true" />
            {loading ? "Calcul en cours..." : "Voir mon résultat"}
          </Button>
        )}
      </div>
    </div>
  )
}
