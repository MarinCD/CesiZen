import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getInformations, getCategories } from "@/lib/services/informationService"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight, Search } from "lucide-react"
import { DeleteArticleButton } from "@/components/admin/DeleteArticleButton"
import { ArticleFormModal } from "@/components/admin/ArticleFormModal"

interface Props {
  searchParams: { search?: string; categorie?: string; page?: string }
}

export default async function InformationsPage({ searchParams }: Props) {
  const search = searchParams.search || ""
  const categorie = searchParams.categorie || ""
  const page = parseInt(searchParams.page || "1")

  const [{ items, total, pages }, categories, session] = await Promise.all([
    getInformations({ search, categorie, page }),
    getCategories(),
    getServerSession(authOptions),
  ])
  const isAdmin = (session?.user as any)?.role === "ADMINISTRATEUR"

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ressources bien-être</h1>
          <p className="text-muted-foreground">
            Articles et guides sur la santé mentale, le stress et le bien-être.
          </p>
        </div>
        {isAdmin && <ArticleFormModal mode="create" />}
      </div>

      {/* Filtres */}
      <form method="GET" className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Rechercher un article..."
            aria-label="Rechercher un article"
            className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" variant="outline">Rechercher</Button>
      </form>

      {/* Catégories */}
      <div className="flex flex-wrap gap-2 mb-8" role="list" aria-label="Filtres par catégorie">
        <Link
          href="/informations"
          role="listitem"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !categorie
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Toutes
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/informations?categorie=${encodeURIComponent(cat)}${search ? `&search=${search}` : ""}`}
            role="listitem"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              categorie === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Articles */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>Aucun article trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {article.categorie && (
                      <Badge variant="secondary" className="w-fit mb-2">{article.categorie}</Badge>
                    )}
                    <CardTitle className="text-lg leading-snug">{article.titre}</CardTitle>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 flex-shrink-0">
                      <ArticleFormModal
                        mode="edit"
                        articleId={article.id}
                        triggerVariant="ghost"
                        triggerSize="icon"
                        ariaLabel={`Modifier ${article.titre}`}
                      />
                      <DeleteArticleButton id={article.id} titre={article.titre} />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                  {article.texte}
                </p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  {article.datePublication && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" aria-hidden="true" />
                      {new Date(article.datePublication).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                  <Link
                    href={`/informations/${article.id}`}
                    className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1 ml-auto"
                    aria-label={`Lire l'article : ${article.titre}`}
                  >
                    Lire
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-8" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/informations?page=${p}${search ? `&search=${search}` : ""}${categorie ? `&categorie=${categorie}` : ""}`}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "border border-input hover:bg-accent"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
