"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface Props {
  id: number
  titre: string
}

export function DeleteArticleButton({ id, titre }: Props) {
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Supprimer l'article "${titre}" ?`)) return
    const res = await fetch(`/api/informations/${id}`, { method: "DELETE" })
    if (res.ok) router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      aria-label={`Supprimer ${titre}`}
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
