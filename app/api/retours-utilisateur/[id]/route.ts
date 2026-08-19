import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { clientIp } from "@/lib/rateLimit"
import { updateStatutRetourUtilisateur } from "@/lib/services/retourUtilisateurService"
import { parseId } from "@/lib/validations/params"
import { statutRetourUtilisateurSchema } from "@/lib/validations/retourUtilisateurSchema"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string }).role !== "ADMINISTRATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const id = parseId((await params).id)
  if (id === null) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  const result = statutRetourUtilisateurSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const retour = await updateStatutRetourUtilisateur(id, result.data.statut)
    const actorId = Number((session.user as { id?: string }).id)

    await logAudit({
      action: "USER_FEEDBACK_STATUS_CHANGED",
      actorId: Number.isInteger(actorId) ? actorId : undefined,
      targetId: id,
      ip: clientIp(req),
      metadata: { statut: result.data.statut },
    })

    return NextResponse.json(retour)
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Retour introuvable" }, { status: 404 })
    }
    throw error
  }
}
