import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InformationForm } from "@/components/admin/InformationForm"

export default function NouvelArticlePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Nouvel article</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rédiger un article</CardTitle>
        </CardHeader>
        <CardContent>
          <InformationForm />
        </CardContent>
      </Card>
    </div>
  )
}
