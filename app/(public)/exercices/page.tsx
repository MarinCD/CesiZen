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

      {/* Info */}
      <div className="mt-8 bg-blue-50 rounded-xl p-5 text-sm text-blue-700">
        <strong>Conseil :</strong> Pour de meilleurs résultats, pratiquez dans un endroit calme,
        assis ou allongé confortablement. La cohérence cardiaque est particulièrement efficace
        3 fois par jour (matin, midi et soir) pendant 5 minutes.
      </div>
    </div>
  )
}
