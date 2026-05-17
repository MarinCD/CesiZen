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
