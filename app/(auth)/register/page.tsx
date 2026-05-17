"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [globalError, setGlobalError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setGlobalError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const body = {
      nom: formData.get("nom"),
      prenom: formData.get("prenom"),
      email: formData.get("email"),
      motDePasse: formData.get("motDePasse"),
      consentementRGPD: formData.get("consentementRGPD") === "on" ? true : undefined,
    }

    const res = await fetch("/api/utilisateurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setLoading(false)

    if (res.ok) {
      router.push("/login?registered=true")
    } else {
      const data = await res.json()
      if (data.error && typeof data.error === "object") {
        setErrors(data.error)
      } else {
        setGlobalError(data.error || "Une erreur est survenue.")
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Créer un compte</CardTitle>
        <CardDescription>Rejoignez CESIZen pour sauvegarder vos données de bien-être</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {globalError && (
            <div role="alert" className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {globalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input id="prenom" name="prenom" autoComplete="given-name" required />
              {errors.prenom && <p className="text-xs text-destructive">{errors.prenom[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" name="nom" autoComplete="family-name" required />
              {errors.nom && <p className="text-xs text-destructive">{errors.nom[0]}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="votre@email.fr" />
            {errors.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="motDePasse">Mot de passe</Label>
            <Input id="motDePasse" name="motDePasse" type="password" autoComplete="new-password" required />
            <p className="text-xs text-muted-foreground">
              Minimum 8 caractères, une majuscule et un chiffre
            </p>
            {errors.motDePasse && <p className="text-xs text-destructive">{errors.motDePasse[0]}</p>}
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
            <input
              type="checkbox"
              id="consentementRGPD"
              name="consentementRGPD"
              required
              className="mt-0.5 h-4 w-4 rounded border-gray-300"
              aria-required="true"
            />
            <Label htmlFor="consentementRGPD" className="text-sm font-normal leading-relaxed cursor-pointer">
              J'accepte que mes données personnelles soient traitées par CESIZen conformément à la{" "}
              <Link href="#" className="text-primary underline">politique de confidentialité</Link>{" "}
              et au RGPD. Mes données sont hébergées en France et ne sont jamais transmises à des tiers.
            </Label>
          </div>
          {errors.consentementRGPD && (
            <p className="text-xs text-destructive">{errors.consentementRGPD[0]}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Création en cours..." : "Créer mon compte"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
