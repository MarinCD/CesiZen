import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, XCircle, BookOpen } from "lucide-react"

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
      "Identifiez les sources de stress sur lesquelles vous pouvez agir.",
      "Accordez-vous des moments de repos et de récupération quotidiens.",
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
          <div className="text-6xl font-bold text-foreground mb-2" aria-live="polite">
            {score}
          </div>
          <div className="text-muted-foreground mb-4">points</div>
          <Badge variant={level.badge} className="text-sm px-4 py-1 mx-auto">
            {level.label}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{level.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nos recommandations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3" aria-label="Recommandations personnalisées">
            {level.conseils.map((conseil, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground">{conseil}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
          <Link href="/informations">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            <span>Lire des ressources</span>
          </Link>
        </Button>
        <Button asChild className="h-auto py-4 flex-col gap-2">
          <Link href="/diagnostic">
            Refaire le diagnostic
          </Link>
        </Button>
      </div>

      {saved ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-700 text-sm font-medium">
            Résultat sauvegardé dans votre historique
          </p>
          <Button variant="link" asChild className="text-green-700">
            <Link href="/historique">Voir mon historique</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-700 text-sm mb-3">
            Créez un compte gratuit pour sauvegarder et suivre l'évolution de vos résultats.
          </p>
          <div className="flex gap-2 justify-center">
            <Button size="sm" asChild>
              <Link href="/register">Créer un compte</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
