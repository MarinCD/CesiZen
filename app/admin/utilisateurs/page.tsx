import { getAllUsers } from "@/lib/services/userService"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminUsersClient } from "@/components/admin/UsersTable"

export default async function AdminUtilisateursPage() {
  const users = await getAllUsers()

  const serialized = users.map((u) => ({
    ...u,
    dateCreation: u.dateCreation.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground mt-1">{users.length} utilisateur{users.length > 1 ? "s" : ""} inscrits</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <AdminUsersClient users={serialized} />
        </CardContent>
      </Card>
    </div>
  )
}
