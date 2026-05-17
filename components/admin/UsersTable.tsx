"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Shield, User } from "lucide-react"

interface UserRow {
  id: number
  nom: string | null
  prenom: string | null
  email: string
  role: string
  dateCreation: string
}

export function AdminUsersClient({ users: initialUsers }: { users: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers)

  const handleDelete = async (id: number, email: string) => {
    if (!confirm(`Supprimer l'utilisateur ${email} ? Cette action est irréversible.`)) return
    await fetch(`/api/utilisateurs/${id}`, { method: "DELETE" })
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const handleRoleChange = async (id: number, newRole: string) => {
    const res = await fetch(`/api/utilisateurs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)))
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" aria-label="Liste des utilisateurs">
        <thead className="border-b bg-gray-50">
          <tr>
            <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Utilisateur</th>
            <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
            <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Rôle</th>
            <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Inscription</th>
            <th scope="col" className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium">{u.prenom} {u.nom}</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-3">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  aria-label={`Rôle de ${u.email}`}
                  className="text-xs border rounded px-2 py-1 bg-background"
                >
                  <option value="UTILISATEUR">Utilisateur</option>
                  <option value="ADMINISTRATEUR">Administrateur</option>
                  <option value="VISITEUR">Visiteur</option>
                </select>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(u.dateCreation).toLocaleDateString("fr-FR")}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(u.id, u.email)}
                  aria-label={`Supprimer ${u.email}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
