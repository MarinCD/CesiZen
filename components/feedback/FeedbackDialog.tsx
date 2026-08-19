"use client"

import { FormEvent, useState } from "react"
import { usePathname } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { Lightbulb, MessageSquareWarning, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type FeedbackType = "PROPOSITION" | "ANOMALIE"

function errorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return "L'envoi a échoué. Veuillez réessayer."
  }

  const error = payload.error
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const first = Object.values(error).flat().find((value) => typeof value === "string")
    if (typeof first === "string") return first
  }
  return "L'envoi a échoué. Veuillez vérifier les champs."
}

export function FeedbackDialog() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>("PROPOSITION")
  const [estBloquant, setEstBloquant] = useState(false)
  const [emplacement, setEmplacement] = useState("")
  const [description, setDescription] = useState("")
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const resetForm = () => {
    setType("PROPOSITION")
    setEstBloquant(false)
    setEmplacement("")
    setDescription("")
    setSuccess(false)
    setError("")
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) resetForm()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setError("")

    try {
      const response = await fetch("/api/retours-utilisateur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          estBloquant,
          emplacement,
          pageUrl: pathname,
          description,
        }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setError(errorMessage(payload))
        return
      }

      setSuccess(true)
    } catch {
      setError("La connexion au serveur a échoué. Veuillez réessayer.")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" className="h-auto gap-2 whitespace-normal text-left">
          <MessageSquareWarning className="h-4 w-4 shrink-0" aria-hidden="true" />
          Proposer une amélioration ou signaler un bug
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-background p-6 shadow-xl">
          <div className="pr-8">
            <Dialog.Title className="text-xl font-semibold">Votre retour sur CESIZen</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              Signalez une anomalie ou proposez une amélioration. Votre retour sera transmis à
              l'équipe d'administration.
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Fermer"
              className="absolute right-4 top-4 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>

          {success ? (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-5 text-center">
              <Lightbulb className="mx-auto h-8 w-8 text-green-700" aria-hidden="true" />
              <p className="mt-3 font-medium text-green-900">Merci, votre retour a bien été envoyé.</p>
              <p className="mt-1 text-sm text-green-800">
                Il pourra maintenant être consulté et suivi depuis l'administration.
              </p>
              <Dialog.Close asChild>
                <Button className="mt-4">Fermer</Button>
              </Dialog.Close>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <fieldset>
                <legend className="text-sm font-medium">Nature du retour</legend>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="type-retour"
                      value="PROPOSITION"
                      checked={type === "PROPOSITION"}
                      onChange={() => setType("PROPOSITION")}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium">Proposition</span>
                      <span className="block text-xs text-muted-foreground">Une idée d'amélioration</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="type-retour"
                      value="ANOMALIE"
                      checked={type === "ANOMALIE"}
                      onChange={() => setType("ANOMALIE")}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium">Anomalie</span>
                      <span className="block text-xs text-muted-foreground">Quelque chose ne fonctionne pas</span>
                    </span>
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium">Est-ce bloquant ?</legend>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bloquant signifie que vous ne pouvez pas terminer ce que vous vouliez faire.
                </p>
                <div className="mt-2 flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="bloquant"
                      checked={!estBloquant}
                      onChange={() => setEstBloquant(false)}
                    />
                    Non
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="bloquant"
                      checked={estBloquant}
                      onChange={() => setEstBloquant(true)}
                    />
                    Oui
                  </label>
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="feedback-emplacement">Où cela se produit-il ?</Label>
                <Input
                  id="feedback-emplacement"
                  value={emplacement}
                  onChange={(event) => setEmplacement(event.target.value)}
                  placeholder="Ex. page Diagnostic, après avoir cliqué sur Calculer"
                  minLength={3}
                  maxLength={160}
                  required
                />
                <p className="text-xs text-muted-foreground">Page détectée : {pathname}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="feedback-description">Description</Label>
                  <span className="text-xs text-muted-foreground">{description.length}/2000</span>
                </div>
                <Textarea
                  id="feedback-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Décrivez ce que vous avez observé et ce que vous attendiez."
                  minLength={10}
                  maxLength={2000}
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  N'indiquez aucune donnée médicale, mot de passe ou information personnelle.
                </p>
              </div>

              {error && (
                <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline">Annuler</Button>
                </Dialog.Close>
                <Button type="submit" disabled={pending}>
                  {pending ? "Envoi…" : "Envoyer mon retour"}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
