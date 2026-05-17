import Link from "next/link"
import { getQuestionnaires } from "@/lib/services/diagnosticService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClipboardList, ChevronRight } from "lucide-react"

export default async function AdminQuestionnairesPage() {
  const questionnaires = await getQuestionnaires()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Questionnaires</h1>
        <p className="text-muted-foreground mt-1">Gérez les questionnaires de diagnostic.</p>
      </div>

      <div className="space-y-4">
        {questionnaires.map((q) => (
          <Card key={q.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h2 className="font-semibold">{q.titre}</h2>
                  </div>
                  {q.description && (
                    <p className="text-sm text-muted-foreground mb-2">{q.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{q.questions.length} questions</Badge>
                    <Badge variant="outline">{q.diagnostics.length} diagnostic{q.diagnostics.length > 1 ? "s" : ""}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Créé le {new Date(q.dateCreation).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/questionnaires/${q.id}`}>
                    Voir
                    <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
