"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Trash2 } from "lucide-react"

export default function ProfilPage() {
  const { data: session, update } = useSession()
  const user = session?.user as any

  const [form, setForm] = useState({ prenom: "", nom: "", email: "", motDePasse: "" })
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      const [prenom = "", nom = ""] = (user.name || "").split(" ")
      setForm({ prenom, nom, email: user.email || "", motDePasse: "" })
    }
  }, [session])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    const body: any = { prenom: form.prenom, nom: form.nom, email: form.email }
    if (form.motDePasse) body.motDePasse = form.motDePasse

    const res = await fetch(`/api/utilisateurs/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setLoading(false)
    if (res.ok) {
      setSuccess("Profil mis à jour avec succès.")
      setForm((f) => ({ ...f, motDePasse: "" }))
    } else {
      const data = await res.json()
      setError(data.error || "Erreur lors de la mise à jour.")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données.")) return
    setDeleting(true)
    await fetch(`/api/utilisateurs/${user.id}`, { method: "DELETE" })
    signOut({ callbackUrl: "/" })
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-muted-foreground mt-1">Gérez vos informations personnelles.</p>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4" noValidate>
            {success && (
              <div role="status" className="flex items-center gap-2 bg-green-50 text-green-700 rounded-md p-3 text-sm">
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                {success}
              </div>
            )}
            {error && (
              <div role="alert" className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motDePasse">Nouveau mot de passe (laisser vide pour ne pas changer)</Label>
              <Input
                id="motDePasse"
                type="password"
                value={form.motDePasse}
                onChange={(e) => setForm((f) => ({ ...f, motDePasse: e.target.value }))}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Sauvegarder"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zone dangereuse</CardTitle>
          <CardDescription>
            La suppression de votre compte est irréversible et efface toutes vos données (RGPD — droit à l'effacement).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
            {deleting ? "Suppression..." : "Supprimer mon compte"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
