import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { clientIp, rateLimit } from "@/lib/rateLimit"
import { createRetourUtilisateur } from "@/lib/services/retourUtilisateurService"
import { retourUtilisateurSchema } from "@/lib/validations/retourUtilisateurSchema"

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, {
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyPrefix: "retour-utilisateur",
  })
  if (limited) return limited

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  const result = retourUtilisateurSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const session = await getServerSession(authOptions)
  const rawUserId = (session?.user as { id?: string } | undefined)?.id
  const utilisateurId = rawUserId ? Number(rawUserId) : undefined
  const validUtilisateurId =
    utilisateurId && Number.isInteger(utilisateurId) && utilisateurId > 0
      ? utilisateurId
      : undefined

  const retour = await createRetourUtilisateur({
    ...result.data,
    utilisateurId: validUtilisateurId,
  })

  await logAudit({
    action: "USER_FEEDBACK_CREATED",
    actorId: validUtilisateurId,
    targetId: retour.id,
    ip: clientIp(req),
    metadata: {
      type: result.data.type,
      bloquant: result.data.estBloquant,
    },
  })

  return NextResponse.json({ id: retour.id }, { status: 201 })
}
