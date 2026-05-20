import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAllUsers, createUser } from "@/lib/services/userService"
import { registerSchema } from "@/lib/validations/userSchema"
import { rateLimit } from "@/lib/rateLimit"
import { logAudit } from "@/lib/audit"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMINISTRATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const users = await getAllUsers()
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { windowMs: 60_000, max: 5, keyPrefix: "register" })
  if (limited) {
    await logAudit({
      action: "RATE_LIMIT_HIT",
      ip: req.headers.get("x-forwarded-for") || null,
      metadata: { route: "register" },
    })
    return limited
  }

  const body = await req.json()

  const result = registerSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const user = await createUser({
      nom: result.data.nom,
      prenom: result.data.prenom,
      email: result.data.email,
      motDePasse: result.data.motDePasse,
      consentementRGPD: result.data.consentementRGPD,
    })
    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
