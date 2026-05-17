"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Pencil } from "lucide-react"

interface Article {
  id: number
  titre: string
  categorie: string | null
  datePublication: string | null
}

export function AdminInformationsClient({ articles: initial }: { articles: Article[] }) {
  const [articles, setArticles] = useState(initial)

  const handleDelete = async (id: number, titre: string) => {
    if (!confirm(`Supprimer l'article "${titre}" ?`)) return
    await fetch(`/api/informations/${id}`, { method: "DELETE" })
    setArticles((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="Liste des articles">
        <thead className="border-b bg-gray-50">
          <tr>
            <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Titre</th>
            <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Catégorie</th>
            <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Publication</th>
            <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {articles.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium max-w-xs truncate">{a.titre}</td>
              <td className="px-4 py-3">
                {a.categorie ? <Badge variant="secondary">{a.categorie}</Badge> : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {a.datePublication ? new Date(a.datePublication).toLocaleDateString("fr-FR") : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild aria-label={`Modifier ${a.titre}`}>
                    <Link href={`/admin/informations/${a.id}/modifier`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(a.id, a.titre)}
                    aria-label={`Supprimer ${a.titre}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
