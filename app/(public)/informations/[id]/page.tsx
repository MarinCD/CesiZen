import Link from "next/link"
import { notFound } from "next/navigation"
import { getInformationById } from "@/lib/services/informationService"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, User } from "lucide-react"

interface Props {
  params: { id: string }
}

export default async function InformationDetailPage({ params }: Props) {
  const article = await getInformationById(parseInt(params.id))
  if (!article) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/informations">
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Retour aux articles
        </Link>
      </Button>

      <article>
        <header className="mb-8">
          {article.categorie && (
            <Badge variant="secondary" className="mb-4">{article.categorie}</Badge>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.titre}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {article.datePublication && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <time dateTime={article.datePublication.toISOString()}>
                  {new Date(article.datePublication).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </span>
            )}
            {(article.createur.prenom || article.createur.nom) && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" aria-hidden="true" />
                {article.createur.prenom} {article.createur.nom}
              </span>
            )}
          </div>
        </header>

        <div className="prose prose-gray max-w-none">
          {article.texte.split("\n").map((paragraph, i) => (
            <p key={i} className="mb-4 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      <div className="mt-12 pt-8 border-t">
        <p className="text-sm text-muted-foreground italic">
          Les informations contenues dans cet article sont fournies à titre informatif uniquement
          et ne remplacent pas un avis médical professionnel.
        </p>
      </div>
    </div>
  )
}
