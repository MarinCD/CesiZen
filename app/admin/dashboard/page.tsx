import { getGlobalStats, getRecentUsers, getRecentDiagnostics } from "@/lib/services/userService"
import { StatsCard } from "@/components/admin/StatsCard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Brain, FileText, Activity } from "lucide-react"

export default async function AdminDashboardPage() {
  const [stats, recentUsers, recentDiagnostics] = await Promise.all([
    getGlobalStats(),
    getRecentUsers(5),
    getRecentDiagnostics(5),
  ])

  const getBadge = (interpretation: string | null) => {
    if (interpretation === "FAIBLE") return <Badge variant="success">Faible</Badge>
    if (interpretation === "MODERE") return <Badge variant="warning">Modéré</Badge>
    return <Badge variant="danger">Élevé</Badge>
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
          title="Entrées tracker (ce mois)"
          value={stats.entreeTrackerCeMois}
          icon={Activity}
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

        {/* Derniers diagnostics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Derniers diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDiagnostics.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="text-sm font-medium">
                      {d.utilisateur.prenom} {d.utilisateur.nom}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(d.dateRealisation).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{d.score} pts</span>
                    {getBadge(d.interpretation)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
