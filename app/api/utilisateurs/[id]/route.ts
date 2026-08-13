import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserById, updateUser, deleteUser } from "@/lib/services/userService"
import { updateUserSchema } from "@/lib/validations/userSchema"
import { parseId } from "@/lib/validations/params"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { clientIp } from "@/lib/rateLimit"
import bcrypt from "bcryptjs"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const sessionUser = session.user as any
  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })

  // Un utilisateur peut voir son propre profil, un admin peut voir tous
  if (sessionUser.role !== "ADMINISTRATEUR" && sessionUser.id !== String(id)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const user = await getUserById(id)
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

  return NextResponse.json(user)
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const sessionUser = session.user as any
  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })

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

  const wantsPasswordChange = !!result.data.motDePasse && result.data.motDePasse.length > 0
  const isSelfUpdate = sessionUser.id === String(id)

  const existing = await prisma.utilisateur.findUnique({
    where: { id },
    select: { motDePasse: true, email: true, role: true },
  })
  if (!existing) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  // Un changement d'email détourne les futurs contacts et l'identifiant de
  // connexion : sur son propre compte, il exige la même preuve qu'un changement
  // de mot de passe, pour qu'une session laissée ouverte ne suffise pas.
  const wantsEmailChange =
    !!result.data.email && result.data.email.toLowerCase() !== existing.email.toLowerCase()
  const needsCurrentPassword = isSelfUpdate && (wantsPasswordChange || wantsEmailChange)

  if (needsCurrentPassword) {
    if (!result.data.ancienMotDePasse) {
      return NextResponse.json(
        {
          error: wantsPasswordChange
            ? "L'ancien mot de passe est requis pour modifier le mot de passe."
            : "Votre mot de passe actuel est requis pour modifier votre adresse email.",
        },
        { status: 400 }
      )
    }
    const ok = await bcrypt.compare(result.data.ancienMotDePasse, existing.motDePasse)
    if (!ok) {
      return NextResponse.json(
        { error: "L'ancien mot de passe est incorrect." },
        { status: 400 }
      )
    }
  }

  try {
    const updates = { ...result.data }
    delete updates.ancienMotDePasse
    const user = await updateUser(id, {
      ...updates,
      role: updates.role as Role | undefined,
    })

    const roleChanged = !!result.data.role && result.data.role !== existing.role
    await logAudit({
      action: roleChanged ? "USER_ROLE_CHANGED" : "USER_UPDATED",
      actorId: parseInt(sessionUser.id),
      targetId: id,
      ip: clientIp(req),
      metadata: {
        // Aucune valeur, seulement la nature de la modification.
        champs: Object.keys(updates).filter((key) => key !== "motDePasse"),
        motDePasseModifie: wantsPasswordChange,
        emailModifie: wantsEmailChange,
        ...(roleChanged ? { ancienRole: existing.role, nouveauRole: result.data.role } : {}),
        parAdmin: !isSelfUpdate,
      },
    })

    return NextResponse.json(user)
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const sessionUser = session.user as any
  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })

  const isSelfDelete = sessionUser.id === String(id)
  if (sessionUser.role !== "ADMINISTRATEUR" && !isSelfDelete) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  try {
    await deleteUser(id)
    await logAudit({
      action: "USER_DELETED",
      actorId: parseInt(sessionUser.id),
      targetId: id,
      ip: clientIp(req),
      metadata: { parAdmin: !isSelfDelete },
    })
    return NextResponse.json({ message: "Compte supprimé" })
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
