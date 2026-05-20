import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { QuestionnaireForm } from "@/components/admin/QuestionnaireForm"

export default function NouveauQuestionnairePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/questionnaires">
            <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Retour
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau questionnaire</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Créer un questionnaire de diagnostic</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionnaireForm />
        </CardContent>
      </Card>
    </div>
  )
}
