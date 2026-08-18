import { getGlobalStats, getRecentUsers, getRepartitionStress } from "@/lib/services/userService"
import { StatsCard } from "@/components/admin/StatsCard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Brain, FileText, TrendingUp } from "lucide-react"

export default async function AdminDashboardPage() {
  const [stats, recentUsers, repartition] = await Promise.all([
    getGlobalStats(),
    getRecentUsers(5),
    getRepartitionStress(),
  ])

  const libelles: Record<string, { texte: string; badge: "success" | "warning" | "danger" }> = {
    FAIBLE: { texte: "Faible", badge: "success" },
    MODERE: { texte: "Modéré", badge: "warning" },
    ELEVE: { texte: "Élevé", badge: "danger" },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de la plateforme CESIZen.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Utilisateurs inscrits"
          value={stats.totalUtilisateurs}
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatsCard
          title="Diagnostics réalisés"
          value={stats.diagnosticsRealises}
          icon={Brain}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <StatsCard
          title="Articles publiés"
          value={stats.articlesPublies}
          icon={FileText}
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatsCard
          title="Diagnostics ce mois"
          value={stats.diagnosticsCeMois}
          icon={TrendingUp}
          color="text-rose-600"
          bg="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Derniers utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Derniers inscrits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="text-sm font-medium">{u.prenom} {u.nom}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {u.role === "ADMINISTRATEUR" ? "Admin" : "Utilisateur"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.dateCreation).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Répartition anonyme des niveaux de stress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Niveaux de stress</CardTitle>
            <p className="text-xs text-muted-foreground">
              Données de santé : agrégats anonymes uniquement. Les résultats individuels ne
              sont accessibles qu'à la personne concernée.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {repartition.repartition.map((r) => {
                const libelle = libelles[r.palier]
                const part =
                  r.effectif !== null && repartition.total > 0
                    ? Math.round((r.effectif / repartition.total) * 100)
                    : null
                return (
                  <div key={r.palier} className="flex items-center justify-between p-2 rounded-lg">
                    <Badge variant={libelle.badge}>{libelle.texte}</Badge>
                    <span className="text-sm font-medium">
                      {r.effectif === null ? (
                        <span className="text-muted-foreground">
                          &lt; {repartition.seuil} — masqué
                        </span>
                      ) : (
                        <>
                          {r.effectif} diagnostic{r.effectif > 1 ? "s" : ""} ({part} %)
                        </>
                      )}
                    </span>
                  </div>
                )
              })}
              <p className="text-xs text-muted-foreground pt-2 border-t">
                La répartition reste masquée tant que chaque niveau ne compte pas au moins{" "}
                {repartition.seuil} résultats.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
