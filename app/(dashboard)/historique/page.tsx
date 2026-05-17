import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getHistoriqueDiagnostics } from "@/lib/services/diagnosticService"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
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
            <p className="text-sm mt-1">Faites votre premier diagnostic pour voir votre historique ici.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Graphique */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution du score</CardTitle>
            </CardHeader>
            <CardContent>
              <HistoriqueChart data={chartData} />
            </CardContent>
          </Card>

          {/* Liste */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tous les résultats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resultats.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(r.dateRealisation).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
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
