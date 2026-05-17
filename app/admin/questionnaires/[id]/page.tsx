import { notFound } from "next/navigation"
import Link from "next/link"
import { getQuestionnaireById } from "@/lib/services/diagnosticService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface Props {
  params: { id: string }
}

export default async function QuestionnaireDetailPage({ params }: Props) {
  const questionnaire = await getQuestionnaireById(parseInt(params.id))
  if (!questionnaire) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/questionnaires">
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Retour
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{questionnaire.titre}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Questions ({questionnaire.questions.length})</span>
            <Badge variant="secondary">Score max : {questionnaire.questions.reduce((s, q) => s + q.pointsAssocies, 0)} pts</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {questionnaire.questions.map((q, i) => (
              <div key={q.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-6 text-right">{i + 1}.</span>
                  <span className="text-sm">{q.texte}</span>
                </div>
                <Badge variant="outline" className="flex-shrink-0">{q.pointsAssocies} pts</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
