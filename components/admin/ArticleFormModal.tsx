"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InformationForm } from "@/components/admin/InformationForm"
import { Plus, Pencil, X } from "lucide-react"

interface Props {
  mode: "create" | "edit"
  articleId?: number
  triggerLabel?: string
  triggerVariant?: "default" | "ghost"
  triggerSize?: "default" | "icon"
  ariaLabel?: string
}

export function ArticleFormModal({
  mode,
  articleId,
  triggerLabel,
  triggerVariant = "default",
  triggerSize = "default",
  ariaLabel,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialValues, setInitialValues] = useState<{
    titre: string
    texte: string
    categorie: string
    datePublication: string
  } | null>(null)

  useEffect(() => {
    if (!open) return

    if (mode === "edit" && articleId) {
      setLoading(true)
      fetch(`/api/informations/${articleId}`)
        .then((r) => r.json())
        .then((data) => {
          setInitialValues({
            titre: data.titre || "",
            texte: data.texte || "",
            categorie: data.categorie || "",
            datePublication: data.datePublication || "",
          })
        })
        .finally(() => setLoading(false))
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, mode, articleId])

  const handleSuccess = () => {
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        className={triggerSize === "icon" ? "h-8 w-8" : undefined}
      >
        {mode === "create" ? (
          <>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            {triggerLabel || "Nouvel article"}
          </>
        ) : triggerSize === "icon" ? (
          <Pencil className="h-4 w-4" />
        ) : (
          <>
            <Pencil className="h-4 w-4 mr-2" />
            {triggerLabel || "Modifier"}
          </>
        )}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 id="article-modal-title" className="text-lg font-semibold">
                {mode === "create" ? "Nouvel article" : "Modifier l'article"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-5">
              {mode === "edit" && loading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <InformationForm
                  articleId={articleId}
                  initialValues={mode === "edit" ? initialValues ?? undefined : undefined}
                  onSuccess={handleSuccess}
                  onCancel={() => setOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
