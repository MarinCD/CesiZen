"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"

type FeedbackStatus = "NOUVEAU" | "EN_COURS" | "TRAITE"

interface FeedbackRow {
  id: number
  type: "PROPOSITION" | "ANOMALIE"
  estBloquant: boolean
  emplacement: string
  pageUrl: string | null
  description: string
  statut: FeedbackStatus
  dateCreation: string
  utilisateur: {
    id: number
    nom: string | null
    prenom: string | null
    email: string
  } | null
}

const statusLabels: Record<FeedbackStatus, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  TRAITE: "Traité",
}

export function AdminRetoursClient({ retours: initial }: { retours: FeedbackRow[] }) {
  const [retours, setRetours] = useState(initial)
  const [filter, setFilter] = useState<"TOUS" | FeedbackStatus>("TOUS")
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState("")

  const filtered = useMemo(
    () => retours.filter((retour) => filter === "TOUS" || retour.statut === filter),
    [filter, retours]
  )

  const updateStatus = async (id: number, statut: FeedbackStatus) => {
    setUpdatingId(id)
    setError("")
    try {
      const response = await fetch(`/api/retours-utilisateur/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      })
      if (!response.ok) throw new Error()
      setRetours((current) =>
        current.map((retour) => (retour.id === id ? { ...retour, statut } : retour))
      )
    } catch {
      setError("Le statut n'a pas pu être mis à jour.")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} retour{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span>Filtrer :</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as "TOUS" | FeedbackStatus)}
            className="rounded-md border bg-background px-3 py-2"
          >
            <option value="TOUS">Tous</option>
            <option value="NOUVEAU">Nouveaux</option>
            <option value="EN_COURS">En cours</option>
            <option value="TRAITE">Traités</option>
          </select>
        </label>
      </div>

      {error && (
        <p role="alert" className="m-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">
          Aucun retour dans cette catégorie.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm" aria-label="Retours des utilisateurs">
            <thead className="border-b bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Nature</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Emplacement</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Auteur</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((retour) => (
                <tr key={retour.id} className="align-top hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                    {new Date(retour.dateCreation).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <Badge variant={retour.type === "ANOMALIE" ? "warning" : "secondary"}>
                        {retour.type === "ANOMALIE" ? "Anomalie" : "Proposition"}
                      </Badge>
                      {retour.estBloquant && <Badge variant="danger">Bloquant</Badge>}
                    </div>
                  </td>
                  <td className="max-w-[190px] px-4 py-4">
                    <p className="font-medium">{retour.emplacement}</p>
                    {retour.pageUrl && (
                      <code className="mt-1 block break-all text-xs text-muted-foreground">
                        {retour.pageUrl}
                      </code>
                    )}
                  </td>
                  <td className="max-w-md whitespace-pre-wrap px-4 py-4 leading-relaxed">
                    {retour.description}
                  </td>
                  <td className="max-w-[190px] px-4 py-4">
                    {retour.utilisateur ? (
                      <>
                        <p className="font-medium">
                          {[retour.utilisateur.prenom, retour.utilisateur.nom]
                            .filter(Boolean)
                            .join(" ") || "Utilisateur"}
                        </p>
                        <p className="break-all text-xs text-muted-foreground">
                          {retour.utilisateur.email}
                        </p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Anonyme</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={retour.statut}
                      disabled={updatingId === retour.id}
                      onChange={(event) =>
                        updateStatus(retour.id, event.target.value as FeedbackStatus)
                      }
                      aria-label={`Statut du retour ${retour.id}`}
                      className="rounded-md border bg-background px-2 py-2 text-sm disabled:opacity-50"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
