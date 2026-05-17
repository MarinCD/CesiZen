# Backup des features supprimées

Ce fichier documente le code complet des 4 features supprimées du projet pour permettre leur régénération à l'identique.

**Features concernées :**
- Diagnostics (questionnaire Holmes & Rahe)
- Exercices de respiration (cohérence cardiaque)
- Tracker d'émotions
- *(Activités de détente — non implémentée)*

---

## 1. Diagnostics — Questionnaire Holmes & Rahe

### Logique métier — `lib/services/diagnosticService.ts`

```ts
import { prisma } from "@/lib/prisma"

export function interpreterScore(score: number): string {
  if (score < 150) return "FAIBLE"
  if (score < 300) return "MODERE"
  return "ELEVE"
}

export async function getQuestionnaires() {
  return prisma.questionnaire.findMany({
    include: {
      questions: true,
      diagnostics: true,
      createur: { select: { nom: true, prenom: true } },
    },
    orderBy: { dateCreation: "desc" },
  })
}

export async function getQuestionnaireById(id: number) {
  return prisma.questionnaire.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { pointsAssocies: "desc" } },
      diagnostics: true,
    },
  })
}

export async function getDiagnosticWithQuestions(diagnosticId: number) {
  return prisma.diagnostic.findUnique({
    where: { id: diagnosticId },
    include: {
      questionnaire: {
        include: {
          questions: { orderBy: { pointsAssocies: "desc" } },
        },
      },
    },
  })
}

export async function submitDiagnostic(data: {
  diagnosticId: number
  questionIds: number[]
  utilisateurId: number
}) {
  const questions = await prisma.question.findMany({
    where: { id: { in: data.questionIds } },
    select: { pointsAssocies: true },
  })

  const score = questions.reduce((sum, q) => sum + q.pointsAssocies, 0)
  const interpretation = interpreterScore(score)

  return prisma.resultatDiagnostic.create({
    data: {
      score,
      interpretation,
      utilisateurId: data.utilisateurId,
      diagnosticId: data.diagnosticId,
    },
  })
}

export async function getHistoriqueDiagnostics(utilisateurId: number) {
  return prisma.resultatDiagnostic.findMany({
    where: { utilisateurId },
    include: { diagnostic: { select: { nom: true } } },
    orderBy: { dateRealisation: "desc" },
  })
}

export async function getFirstDiagnostic() {
  return prisma.diagnostic.findFirst({
    include: {
      questionnaire: {
        include: {
          questions: { orderBy: { pointsAssocies: "desc" } },
        },
      },
    },
  })
}
```

### Validation — `lib/validations/diagnosticSchema.ts`

```ts
import { z } from "zod"

export const diagnosticSubmitSchema = z.object({
  diagnosticId: z.number().int().positive(),
  questionIds: z.array(z.number().int().positive()),
})

export const trackerSchema = z.object({
  emotion: z.string().min(1, "Émotion requise"),
  intensite: z.number().int().min(1).max(5),
  note: z.string().optional(),
  date: z.string().optional(),
})

export type DiagnosticSubmitInput = z.infer<typeof diagnosticSubmitSchema>
export type TrackerInput = z.infer<typeof trackerSchema>
```

### API — `app/api/diagnostics/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { submitDiagnostic, getFirstDiagnostic, interpreterScore } from "@/lib/services/diagnosticService"
import { diagnosticSubmitSchema } from "@/lib/validations/diagnosticSchema"

export async function GET() {
  const diagnostic = await getFirstDiagnostic()
  if (!diagnostic) return NextResponse.json({ error: "Aucun diagnostic trouvé" }, { status: 404 })
  return NextResponse.json(diagnostic)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = diagnosticSubmitSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const session = await getServerSession(authOptions)

  const { prisma } = await import("@/lib/prisma")
  const questions = await prisma.question.findMany({
    where: { id: { in: result.data.questionIds } },
    select: { pointsAssocies: true },
  })
  const score = questions.reduce((sum, q) => sum + q.pointsAssocies, 0)
  const interpretation = interpreterScore(score)

  if (!session) {
    return NextResponse.json({ score, interpretation, saved: false })
  }

  const utilisateurId = parseInt((session.user as any).id)
  const resultat = await submitDiagnostic({
    diagnosticId: result.data.diagnosticId,
    questionIds: result.data.questionIds,
    utilisateurId,
  })

  return NextResponse.json({ ...resultat, saved: true }, { status: 201 })
}
```

### API — `app/api/resultats/route.ts`

```ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getHistoriqueDiagnostics } from "@/lib/services/diagnosticService"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const utilisateurId = parseInt((session.user as any).id)
  const resultats = await getHistoriqueDiagnostics(utilisateurId)
  return NextResponse.json(resultats)
}
```

### API — `app/api/questionnaires/route.ts`

```ts
import { NextResponse } from "next/server"
import { getQuestionnaires } from "@/lib/services/diagnosticService"

export async function GET() {
  const questionnaires = await getQuestionnaires()
  return NextResponse.json(questionnaires)
}
```

### API — `app/api/questionnaires/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server"
import { getQuestionnaireById } from "@/lib/services/diagnosticService"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const questionnaire = await getQuestionnaireById(parseInt(params.id))
  if (!questionnaire) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json(questionnaire)
}
```

### Page — `app/(public)/diagnostic/page.tsx`

```tsx
import { getFirstDiagnostic } from "@/lib/services/diagnosticService"
import { QuestionnaireForm } from "@/components/diagnostic/QuestionnaireForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain } from "lucide-react"

export default async function DiagnosticPage() {
  const diagnostic = await getFirstDiagnostic()

  if (!diagnostic) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Aucun questionnaire disponible pour le moment.</p>
      </div>
    )
  }

  const questions = diagnostic.questionnaire.questions

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <div className="inline-flex p-3 bg-blue-50 rounded-full mb-4">
          <Brain className="h-8 w-8 text-blue-600" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Diagnostic de stress</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Cochez les événements que vous avez vécus au cours des <strong>24 derniers mois</strong>.
          Soyez honnête avec vous-même pour un résultat fiable.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{diagnostic.questionnaire.titre}</CardTitle>
          {diagnostic.questionnaire.description && (
            <p className="text-sm text-muted-foreground">{diagnostic.questionnaire.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <QuestionnaireForm
            diagnosticId={diagnostic.id}
            questions={questions}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

### Page — `app/(public)/diagnostic/resultat/page.tsx`

```tsx
import { ResultatCard } from "@/components/diagnostic/ResultatCard"
import { redirect } from "next/navigation"

interface Props {
  searchParams: { score?: string; interpretation?: string; saved?: string }
}

export default function ResultatPage({ searchParams }: Props) {
  const score = parseInt(searchParams.score || "0")
  const interpretation = searchParams.interpretation || "FAIBLE"
  const saved = searchParams.saved === "true"

  if (!searchParams.score) redirect("/diagnostic")

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Votre résultat</h1>
        <p className="text-muted-foreground">
          Basé sur l'échelle de Holmes & Rahe (1967)
        </p>
      </div>

      <ResultatCard score={score} interpretation={interpretation} saved={saved} />
    </div>
  )
}
```

### Page — `app/(dashboard)/historique/page.tsx`

```tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getHistoriqueDiagnostics } from "@/lib/services/diagnosticService"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HistoriqueChart } from "@/components/diagnostic/HistoriqueChart"
import { Calendar, TrendingUp } from "lucide-react"

export default async function HistoriquePage() {
  const session = await getServerSession(authOptions)
  const userId = parseInt((session!.user as any).id)
  const resultats = await getHistoriqueDiagnostics(userId)

  const chartData = resultats
    .slice()
    .reverse()
    .map((r) => ({
      date: new Date(r.dateRealisation).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      score: r.score,
      interpretation: r.interpretation,
    }))

  const getBadgeVariant = (interp: string | null) => {
    if (interp === "FAIBLE") return "success"
    if (interp === "MODERE") return "warning"
    return "danger"
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Historique des diagnostics</h1>
        <p className="text-muted-foreground mt-1">Suivez l'évolution de votre niveau de stress dans le temps.</p>
      </div>

      {resultats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" aria-hidden="true" />
            <p>Aucun diagnostic réalisé pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-lg">Évolution du score</CardTitle></CardHeader>
            <CardContent><HistoriqueChart data={chartData} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Tous les résultats</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resultats.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(r.dateRealisation).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                        <div className="text-xs text-muted-foreground">{r.diagnostic.nom}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{r.score}</span>
                      <Badge variant={getBadgeVariant(r.interpretation) as any}>
                        {r.interpretation === "FAIBLE" ? "Faible" : r.interpretation === "MODERE" ? "Modéré" : "Élevé"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
```

### Composant — `components/diagnostic/QuestionnaireForm.tsx`

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckSquare, Square, ChevronLeft, ChevronRight, Send } from "lucide-react"

interface Question {
  id: number
  texte: string
  pointsAssocies: number
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
                  {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{question.texte}</span>
                  <span className="ml-2 text-sm text-muted-foreground">({question.pointsAssocies} pts)</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 0}>
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
```

### Composant — `components/diagnostic/ResultatCard.tsx`

```tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, XCircle, BookOpen, Wind } from "lucide-react"

interface Props {
  score: number
  interpretation: string
  saved: boolean
}

const LEVELS = {
  FAIBLE: {
    label: "Faible risque",
    description: "Votre score indique un faible niveau de stress (risque de maladie ~30%). Vous semblez traverser une période relativement sereine.",
    badge: "success" as const,
    icon: CheckCircle,
    color: "text-green-600",
    conseils: [
      "Continuez à maintenir vos bonnes habitudes de vie.",
      "Pratiquez une activité physique régulière pour prévenir le stress.",
      "Cultivez vos relations sociales et vos moments de détente.",
    ],
  },
  MODERE: {
    label: "Risque modéré",
    description: "Votre score indique un niveau de stress modéré (risque de maladie ~50%). Il est important de prendre soin de vous.",
    badge: "warning" as const,
    icon: AlertCircle,
    color: "text-orange-600",
    conseils: [
      "Pratiquez des exercices de respiration comme la cohérence cardiaque.",
      "Identifiez les sources de stress sur lesquelles vous pouvez agir.",
      "N'hésitez pas à en parler à un professionnel de santé si nécessaire.",
    ],
  },
  ELEVE: {
    label: "Risque élevé",
    description: "Votre score indique un niveau de stress élevé (risque de maladie ~80%). Une consultation médicale est recommandée.",
    badge: "danger" as const,
    icon: XCircle,
    color: "text-red-600",
    conseils: [
      "Consultez un professionnel de santé ou un psychologue dès que possible.",
      "Réduisez les sources de stress non essentielles dans votre vie.",
      "Accordez-vous des moments de repos et de récupération quotidiens.",
    ],
  },
}

export function ResultatCard({ score, interpretation, saved }: Props) {
  const level = LEVELS[interpretation as keyof typeof LEVELS] || LEVELS.FAIBLE
  const Icon = level.icon

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Icon className={`h-16 w-16 ${level.color}`} aria-hidden="true" />
          </div>
          <div className="text-6xl font-bold text-foreground mb-2" aria-live="polite">{score}</div>
          <div className="text-muted-foreground mb-4">points</div>
          <Badge variant={level.badge} className="text-sm px-4 py-1 mx-auto">{level.label}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{level.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Nos recommandations</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3" aria-label="Recommandations personnalisées">
            {level.conseils.map((conseil, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5" aria-hidden="true">{i + 1}</span>
                <span className="text-sm text-muted-foreground">{conseil}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
          <Link href="/exercices">
            <Wind className="h-5 w-5" aria-hidden="true" />
            <span>Exercices de respiration</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
          <Link href="/informations">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            <span>Lire des ressources</span>
          </Link>
        </Button>
      </div>

      {saved ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-700 text-sm font-medium">Résultat sauvegardé dans votre historique</p>
          <Button variant="link" asChild className="text-green-700">
            <Link href="/historique">Voir mon historique</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-700 text-sm mb-3">Créez un compte gratuit pour sauvegarder et suivre l'évolution de vos résultats.</p>
          <div className="flex gap-2 justify-center">
            <Button size="sm" asChild><Link href="/register">Créer un compte</Link></Button>
            <Button size="sm" variant="outline" asChild><Link href="/login">Se connecter</Link></Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Composant — `components/diagnostic/HistoriqueChart.tsx`

```tsx
"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

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
          <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 5, fill: "#3b82f6" }} activeDot={{ r: 7 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Ligne orange = 150 pts (risque modéré) · Ligne rouge = 300 pts (risque élevé)
      </p>
    </div>
  )
}
```

---

## 2. Exercices de respiration

### Page — `app/(public)/exercices/page.tsx`

```tsx
import { BreathingExercise } from "@/components/exercices/BreathingExercise"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wind } from "lucide-react"

export default function ExercicesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-green-50 rounded-full mb-4">
          <Wind className="h-8 w-8 text-green-600" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exercices de respiration</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Choisissez un exercice et laissez-vous guider. Ces techniques sont utilisées pour réduire
          le stress, améliorer la concentration et favoriser la relaxation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Choisissez votre exercice</CardTitle>
        </CardHeader>
        <CardContent>
          <BreathingExercise />
        </CardContent>
      </Card>

      <div className="mt-8 bg-blue-50 rounded-xl p-5 text-sm text-blue-700">
        <strong>Conseil :</strong> Pour de meilleurs résultats, pratiquez dans un endroit calme,
        assis ou allongé confortablement. La cohérence cardiaque est particulièrement efficace
        3 fois par jour (matin, midi et soir) pendant 5 minutes.
      </div>
    </div>
  )
}
```

### Composant — `components/exercices/BreathingExercise.tsx`

3 exercices inclus : **Cohérence cardiaque** (5s / 5s), **Box Breathing** (4-4-4-4), **Relaxation 4-7-8**.

Fonctionnement : cercle animé CSS + timer par phase + compteur de cycles + pause/stop.

```tsx
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square } from "lucide-react"

interface Exercise {
  id: string
  name: string
  description: string
  phases: { label: string; duration: number; type: "expand" | "hold" | "shrink" | "hold-low" }[]
  totalCycles: number
}

const EXERCISES: Exercise[] = [
  {
    id: "coherence",
    name: "Cohérence cardiaque",
    description: "5 secondes d'inspiration, 5 secondes d'expiration. Idéal 3 fois par jour.",
    totalCycles: 30,
    phases: [
      { label: "Inspirez", duration: 5, type: "expand" },
      { label: "Expirez", duration: 5, type: "shrink" },
    ],
  },
  {
    id: "box",
    name: "Box Breathing",
    description: "Technique utilisée par les Navy SEALs pour gérer le stress sous pression.",
    totalCycles: 10,
    phases: [
      { label: "Inspirez", duration: 4, type: "expand" },
      { label: "Retenez", duration: 4, type: "hold" },
      { label: "Expirez", duration: 4, type: "shrink" },
      { label: "Retenez", duration: 4, type: "hold-low" },
    ],
  },
  {
    id: "478",
    name: "Relaxation 4-7-8",
    description: "Technique du Dr Andrew Weil pour une relaxation profonde et l'endormissement.",
    totalCycles: 8,
    phases: [
      { label: "Inspirez", duration: 4, type: "expand" },
      { label: "Retenez", duration: 7, type: "hold" },
      { label: "Expirez", duration: 8, type: "shrink" },
    ],
  },
]

const ANIMATION_CLASS: Record<string, string> = {
  expand: "animate-breathe-expand",
  hold: "animate-breathe-hold",
  shrink: "animate-breathe-shrink",
  "hold-low": "animate-breathe-hold-low",
}

export function BreathingExercise() {
  const [selectedId, setSelectedId] = useState("coherence")
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [cyclesDone, setCyclesDone] = useState(0)
  const [totalTime, setTotalTime] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const exercise = EXERCISES.find((e) => e.id === selectedId)!
  const totalDuration = exercise.phases.reduce((s, p) => s + p.duration, 0) * exercise.totalCycles

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false); setPaused(false); setPhaseIndex(0)
    setTimeLeft(0); setCyclesDone(0); setTotalTime(0)
  }, [])

  const start = () => {
    setRunning(true); setPaused(false); setPhaseIndex(0)
    setTimeLeft(exercise.phases[0].duration)
    setCyclesDone(0); setTotalTime(totalDuration)
  }

  useEffect(() => {
    if (!running || paused) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhaseIndex((pIdx) => {
            const nextPhase = (pIdx + 1) % exercise.phases.length
            if (nextPhase === 0) {
              setCyclesDone((c) => {
                if (c + 1 >= exercise.totalCycles) { stop(); return 0 }
                return c + 1
              })
            }
            setTimeLeft(exercise.phases[nextPhase].duration)
            return nextPhase
          })
          return exercise.phases[0].duration
        }
        setTotalTime((t) => Math.max(0, t - 1))
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, paused, exercise, stop])

  const currentPhase = exercise.phases[phaseIndex]
  const animClass = running && !paused ? ANIMATION_CLASS[currentPhase.type] : ""
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Choisir un exercice">
        {EXERCISES.map((ex) => (
          <button key={ex.id} role="radio" aria-checked={selectedId === ex.id}
            onClick={() => { if (!running) { setSelectedId(ex.id); stop() } }} disabled={running}
            className={`p-4 rounded-xl border text-left transition-all ${selectedId === ex.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/50"} disabled:opacity-60`}>
            <div className="font-semibold text-sm mb-1">{ex.name}</div>
            <div className="text-xs text-muted-foreground">{ex.description}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-8 space-y-6" aria-live="polite" aria-atomic="true">
        <div className="relative flex items-center justify-center">
          <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 opacity-80 flex items-center justify-center shadow-lg ${animClass}`}
            style={{ "--duration": `${currentPhase?.duration ?? 5}s` } as React.CSSProperties} aria-hidden="true" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <span className="text-xl font-bold">{running ? currentPhase.label : exercise.phases[0].label}</span>
            {running && <span className="text-3xl font-mono font-bold mt-1">{timeLeft}</span>}
          </div>
        </div>
        {running && (
          <div className="flex gap-8 text-center text-sm text-muted-foreground">
            <div><div className="font-semibold text-foreground">{cyclesDone}/{exercise.totalCycles}</div><div>cycles</div></div>
            <div><div className="font-semibold text-foreground">{formatTime(totalTime)}</div><div>restant</div></div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {!running ? (
          <Button size="lg" onClick={start} className="px-8"><Play className="h-5 w-5 mr-2" />Démarrer</Button>
        ) : (
          <>
            <Button size="lg" variant="outline" onClick={() => setPaused((p) => !p)}>
              {paused ? <><Play className="h-5 w-5 mr-2" />Reprendre</> : <><Pause className="h-5 w-5 mr-2" />Pause</>}
            </Button>
            <Button size="lg" variant="destructive" onClick={stop}><Square className="h-5 w-5 mr-2" />Arrêter</Button>
          </>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Phases : {exercise.phases.map((p) => `${p.label} ${p.duration}s`).join(" → ")}</p>
        <p className="mt-1">{exercise.totalCycles} cycles · durée totale : {formatTime(totalDuration)}</p>
      </div>
    </div>
  )
}
```

> **Note CSS requise** dans `globals.css` : animations `animate-breathe-expand`, `animate-breathe-shrink`, `animate-breathe-hold`, `animate-breathe-hold-low` avec `--duration` en variable CSS.

---

## 3. Tracker d'émotions

### Logique métier — `lib/services/trackerService.ts`

```ts
import { prisma } from "@/lib/prisma"

export async function getTrackerEmotions(utilisateurId: number, days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  return prisma.trackerEmotion.findMany({
    where: { utilisateurId, date: { gte: since } },
    orderBy: { date: "desc" },
  })
}

export async function addTrackerEmotion(data: {
  emotion: string
  intensite: number
  note?: string
  date?: string
  utilisateurId: number
}) {
  return prisma.trackerEmotion.create({
    data: {
      emotion: data.emotion,
      intensite: data.intensite,
      note: data.note,
      date: data.date ? new Date(data.date) : new Date(),
      utilisateurId: data.utilisateurId,
    },
  })
}

export async function deleteTrackerEmotion(id: number, utilisateurId: number) {
  const entry = await prisma.trackerEmotion.findUnique({ where: { id } })
  if (!entry || entry.utilisateurId !== utilisateurId) throw new Error("Non autorisé")
  return prisma.trackerEmotion.delete({ where: { id } })
}
```

### API — `app/api/tracker/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTrackerEmotions, addTrackerEmotion } from "@/lib/services/trackerService"
import { trackerSchema } from "@/lib/validations/diagnosticSchema"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const utilisateurId = parseInt((session.user as any).id)
  const days = parseInt(new URL(req.url).searchParams.get("days") || "30")
  const emotions = await getTrackerEmotions(utilisateurId, days)
  return NextResponse.json(emotions)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const result = trackerSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })

  const utilisateurId = parseInt((session.user as any).id)
  const emotion = await addTrackerEmotion({ ...result.data, utilisateurId })
  return NextResponse.json(emotion, { status: 201 })
}
```

### API — `app/api/tracker/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteTrackerEmotion } from "@/lib/services/trackerService"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const utilisateurId = parseInt((session.user as any).id)

  try {
    await deleteTrackerEmotion(parseInt(params.id), utilisateurId)
    return NextResponse.json({ message: "Entrée supprimée" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
```

### Page — `app/(dashboard)/tracker/page.tsx`

```tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTrackerEmotions } from "@/lib/services/trackerService"
import { TrackerClient } from "@/components/tracker/TrackerClient"

export default async function TrackerPage() {
  const session = await getServerSession(authOptions)
  const userId = parseInt((session!.user as any).id)
  const emotions = await getTrackerEmotions(userId, 30)

  const serialized = emotions.map((e) => ({ ...e, date: e.date.toISOString() }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tracker d'émotions</h1>
        <p className="text-muted-foreground mt-1">Notez vos émotions quotidiennes et visualisez votre évolution.</p>
      </div>
      <TrackerClient initialEmotions={serialized} />
    </div>
  )
}
```

### Composant — `components/tracker/EmotionForm.tsx`

12 émotions disponibles : Joie, Sérénité, Confiance, Anxiété, Tristesse, Colère, Peur, Surprise, Dégoût, Anticipation, Fatigue, Enthousiasme.
Champs : sélection émotion (grille boutons), intensité (range 1-5), note (textarea optionnelle).

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

const EMOTIONS = ["Joie","Sérénité","Confiance","Anxiété","Tristesse","Colère","Peur","Surprise","Dégoût","Anticipation","Fatigue","Enthousiasme"]

interface Props { onAdded: () => void }

export function EmotionForm({ onAdded }: Props) {
  const [emotion, setEmotion] = useState("")
  const [intensite, setIntensite] = useState(3)
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emotion) { setError("Veuillez choisir une émotion."); return }
    setError(""); setLoading(true)
    const res = await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emotion, intensite, note }),
    })
    setLoading(false)
    if (res.ok) { setEmotion(""); setIntensite(3); setNote(""); onAdded() }
    else setError("Erreur lors de l'enregistrement.")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label>Comment vous sentez-vous ?</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup">
          {EMOTIONS.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={emotion === e} onClick={() => setEmotion(e)}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${emotion === e ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="intensite">Intensité : <strong>{intensite}/5</strong></Label>
        <input id="intensite" type="range" min={1} max={5} step={1} value={intensite}
          onChange={(e) => setIntensite(parseInt(e.target.value))} className="w-full accent-primary" />
        <div className="flex justify-between text-xs text-muted-foreground"><span>Légère</span><span>Intense</span></div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">Note (optionnelle)</Label>
        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Décrivez ce que vous ressentez..." rows={3} />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        {loading ? "Enregistrement..." : "Ajouter cette entrée"}
      </Button>
    </form>
  )
}
```

### Composant — `components/tracker/EmotionGraph.tsx`

Graphique Recharts `LineChart` multi-lignes, une couleur par émotion. Données agrégées par jour (moyenne des intensités).

Couleurs par émotion : Joie `#f59e0b`, Sérénité `#10b981`, Confiance `#3b82f6`, Anxiété `#ef4444`, Tristesse `#6366f1`, Colère `#dc2626`, Peur `#7c3aed`, etc.

### Composant — `components/tracker/TrackerClient.tsx`

Composant client orchestrant EmotionForm + EmotionGraph + liste des entrées. Filtre 7j / 30j. Suppression avec confirmation.

---

## 4. Activités de détente

Non implémentée dans cette version. À créer depuis zéro.

**Attendu :** page `/activites` listant des activités de détente (lecture, méditation, yoga, marche…) consultables sans connexion. Possibilité pour l'utilisateur connecté de marquer des favoris.

---

## Fichiers à recréer

| Fichier | Feature |
|---------|---------|
| `lib/services/diagnosticService.ts` | Diagnostics |
| `lib/services/trackerService.ts` | Tracker |
| `lib/validations/diagnosticSchema.ts` | Diagnostics + Tracker |
| `app/api/diagnostics/route.ts` | Diagnostics |
| `app/api/resultats/route.ts` | Diagnostics |
| `app/api/questionnaires/route.ts` | Diagnostics |
| `app/api/questionnaires/[id]/route.ts` | Diagnostics |
| `app/api/tracker/route.ts` | Tracker |
| `app/api/tracker/[id]/route.ts` | Tracker |
| `app/(public)/diagnostic/page.tsx` | Diagnostics |
| `app/(public)/diagnostic/resultat/page.tsx` | Diagnostics |
| `app/(public)/exercices/page.tsx` | Exercices |
| `app/(dashboard)/historique/page.tsx` | Diagnostics |
| `app/(dashboard)/tracker/page.tsx` | Tracker |
| `components/diagnostic/QuestionnaireForm.tsx` | Diagnostics |
| `components/diagnostic/ResultatCard.tsx` | Diagnostics |
| `components/diagnostic/HistoriqueChart.tsx` | Diagnostics |
| `components/exercices/BreathingExercise.tsx` | Exercices |
| `components/tracker/EmotionForm.tsx` | Tracker |
| `components/tracker/EmotionGraph.tsx` | Tracker |
| `components/tracker/TrackerClient.tsx` | Tracker |
