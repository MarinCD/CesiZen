"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Trash2, Download } from "lucide-react"

export default function ProfilPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  const [form, setForm] = useState({ prenom: "", nom: "", email: "", ancienMotDePasse: "", motDePasse: "", confirmMotDePasse: "" })
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      const [prenom = "", nom = ""] = (user.name || "").split(" ")
      setForm({ prenom, nom, email: user.email || "", ancienMotDePasse: "", motDePasse: "", confirmMotDePasse: "" })
    }
  }, [session])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    const body: any = { prenom: form.prenom, nom: form.nom, email: form.email }
    if (form.motDePasse || form.confirmMotDePasse || form.ancienMotDePasse) {
      if (!form.ancienMotDePasse) {
        setLoading(false)
        setError("Veuillez saisir votre mot de passe actuel pour le modifier.")
        return
      }
      if (form.motDePasse !== form.confirmMotDePasse) {
        setLoading(false)
        setError("La confirmation du nouveau mot de passe ne correspond pas.")
        return
      }
      body.ancienMotDePasse = form.ancienMotDePasse
      body.motDePasse = form.motDePasse
    }

    const res = await fetch(`/api/utilisateurs/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setLoading(false)
    if (res.ok) {
      setSuccess("Profil mis à jour avec succès.")
      setForm((f) => ({ ...f, ancienMotDePasse: "", motDePasse: "", confirmMotDePasse: "" }))
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
    <div className="space-y-6 max-w-xl mx-auto">
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

            <div className="space-y-3 p-4 rounded-md border bg-gray-50">
              <p className="text-sm font-medium">Changer mon mot de passe</p>
              <p className="text-xs text-muted-foreground">
                Laissez ces champs vides si vous ne souhaitez pas modifier votre mot de passe.
              </p>

              <div className="space-y-2">
                <Label htmlFor="ancienMotDePasse">Mot de passe actuel</Label>
                <Input
                  id="ancienMotDePasse"
                  type="password"
                  autoComplete="current-password"
                  value={form.ancienMotDePasse}
                  onChange={(e) => setForm((f) => ({ ...f, ancienMotDePasse: e.target.value }))}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motDePasse">Nouveau mot de passe</Label>
                <Input
                  id="motDePasse"
                  type="password"
                  autoComplete="new-password"
                  value={form.motDePasse}
                  onChange={(e) => setForm((f) => ({ ...f, motDePasse: e.target.value }))}
                  placeholder="••••••••"
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 caractères, dont une majuscule et un chiffre.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmMotDePasse">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmMotDePasse"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmMotDePasse}
                  onChange={(e) => setForm((f) => ({ ...f, confirmMotDePasse: e.target.value }))}
                  placeholder="••••••••"
                  minLength={8}
                />
                {form.confirmMotDePasse && form.motDePasse !== form.confirmMotDePasse && (
                  <p className="text-xs text-destructive">Les mots de passe ne correspondent pas.</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Sauvegarder"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Portabilité RGPD */}
      <Card>
        <CardHeader>
          <CardTitle>Mes données</CardTitle>
          <CardDescription>
            Téléchargez l'ensemble de vos données personnelles au format JSON (RGPD — droit à la portabilité, article 20).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href={`/api/utilisateurs/${user?.id}/export`} download>
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Exporter mes données
            </a>
          </Button>
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
