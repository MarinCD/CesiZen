import { notFound } from "next/navigation"
import { getInformationById } from "@/lib/services/informationService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InformationForm } from "@/components/admin/InformationForm"

interface Props {
  params: { id: string }
}

export default async function ModifierArticlePage({ params }: Props) {
  const article = await getInformationById(parseInt(params.id))
  if (!article) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Modifier l'article</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{article.titre}</CardTitle>
        </CardHeader>
        <CardContent>
          <InformationForm
            articleId={article.id}
            initialValues={{
              titre: article.titre,
              texte: article.texte,
              categorie: article.categorie || "",
              datePublication: article.datePublication?.toISOString() || "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
