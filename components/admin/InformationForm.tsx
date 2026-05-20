"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  articleId?: number
  initialValues?: {
    titre: string
    texte: string
    categorie: string
    datePublication: string
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function InformationForm({ articleId, initialValues, onSuccess, onCancel }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    titre: initialValues?.titre || "",
    texte: initialValues?.texte || "",
    categorie: initialValues?.categorie || "",
    datePublication: initialValues?.datePublication
      ? new Date(initialValues.datePublication).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const url = articleId ? `/api/informations/${articleId}` : "/api/informations"
    const method = articleId ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setLoading(false)

    if (res.ok) {
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/admin/informations")
        router.refresh()
      }
    } else {
      const data = await res.json()
      if (typeof data.error === "object") setErrors(data.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="titre">Titre *</Label>
        <Input
          id="titre"
          value={form.titre}
          onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
          required
          minLength={3}
        />
        {errors.titre && <p className="text-xs text-destructive">{errors.titre[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="categorie">Catégorie</Label>
          <Input
            id="categorie"
            value={form.categorie}
            onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))}
            placeholder="Stress, Bien-être, Travail..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="datePublication">Date de publication</Label>
          <Input
            id="datePublication"
            type="date"
            value={form.datePublication}
            onChange={(e) => setForm((f) => ({ ...f, datePublication: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="texte">Contenu *</Label>
        <Textarea
          id="texte"
          value={form.texte}
          onChange={(e) => setForm((f) => ({ ...f, texte: e.target.value }))}
          rows={12}
          required
          minLength={10}
        />
        {errors.texte && <p className="text-xs text-destructive">{errors.texte[0]}</p>}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : articleId ? "Mettre à jour" : "Publier l'article"}
        </Button>
        <Button type="button" variant="outline" onClick={() => (onCancel ? onCancel() : router.back())}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
