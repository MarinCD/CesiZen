import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserById, updateUser, deleteUser } from "@/lib/services/userService"
import { updateUserSchema } from "@/lib/validations/userSchema"
import { Role } from "@prisma/client"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const sessionUser = session.user as any
  const id = parseInt(params.id)

  // Un utilisateur peut voir son propre profil, un admin peut voir tous
  if (sessionUser.role !== "ADMINISTRATEUR" && sessionUser.id !== String(id)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const user = await getUserById(id)
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

  return NextResponse.json(user)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const sessionUser = session.user as any
  const id = parseInt(params.id)

  if (sessionUser.role !== "ADMINISTRATEUR" && sessionUser.id !== String(id)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = updateUserSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  // Seul un admin peut changer le rôle
  if (result.data.role && sessionUser.role !== "ADMINISTRATEUR") {
    return NextResponse.json({ error: "Non autorisé à changer le rôle" }, { status: 403 })
  }

  try {
    const user = await updateUser(id, {
      ...result.data,
      role: result.data.role as Role | undefined,
    })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const sessionUser = session.user as any
  const id = parseInt(params.id)

  if (sessionUser.role !== "ADMINISTRATEUR" && sessionUser.id !== String(id)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    await deleteUser(id)
    return NextResponse.json({ message: "Compte supprimé" })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
