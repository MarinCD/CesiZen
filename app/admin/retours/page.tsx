import { MessageSquareWarning, Siren } from "lucide-react"
import { connection } from "next/server"
import { AdminRetoursClient } from "@/components/admin/AdminRetoursClient"
import { Card, CardContent } from "@/components/ui/card"
import { getRetoursUtilisateur } from "@/lib/services/retourUtilisateurService"

export default async function AdminRetoursPage() {
  // La table est créée par la migration de déploiement : ne pas l'interroger
  // pendant `next build`, qui doit rester indépendant de la base d'exécution.
  await connection()
  const retours = await getRetoursUtilisateur()
  const nouveaux = retours.filter((retour) => retour.statut === "NOUVEAU").length
  const bloquants = retours.filter(
    (retour) => retour.estBloquant && retour.statut !== "TRAITE"
  ).length

  const serialized = retours.map((retour) => ({
    ...retour,
    dateCreation: retour.dateCreation.toISOString(),
    dateMiseAJour: retour.dateMiseAJour.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Retours utilisateurs</h1>
        <p className="mt-1 text-muted-foreground">
          Propositions d'amélioration et anomalies signalées depuis le site.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-full bg-blue-50 p-3 text-blue-700">
              <MessageSquareWarning className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold">{nouveaux}</p>
              <p className="text-sm text-muted-foreground">Nouveaux retours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-full bg-red-50 p-3 text-red-700">
              <Siren className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bloquants}</p>
              <p className="text-sm text-muted-foreground">Bloquants non traités</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <AdminRetoursClient retours={serialized} />
        </CardContent>
      </Card>
    </div>
  )
}
