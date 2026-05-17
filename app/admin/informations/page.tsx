import Link from "next/link"
import { getInformations } from "@/lib/services/informationService"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AdminInformationsClient } from "@/components/admin/AdminInformationsClient"
import { Plus } from "lucide-react"

export default async function AdminInformationsPage() {
  const { items } = await getInformations({ limit: 100 })

  const serialized = items.map((i) => ({
    ...i,
    datePublication: i.datePublication?.toISOString() ?? null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles d'information</h1>
          <p className="text-muted-foreground mt-1">{items.length} article{items.length > 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/admin/informations/nouveau">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Nouvel article
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <AdminInformationsClient articles={serialized} />
        </CardContent>
      </Card>
    </div>
  )
}
