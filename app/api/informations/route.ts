import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getInformations, createInformation } from "@/lib/services/informationService"
import { informationSchema } from "@/lib/validations/informationSchema"
import { parsePage } from "@/lib/validations/params"
import { logAudit } from "@/lib/audit"
import { clientIp } from "@/lib/rateLimit"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || undefined
  const categorie = searchParams.get("categorie") || undefined
  const page = parsePage(searchParams.get("page"))
  if (page === null) {
    return NextResponse.json({ error: "Paramètre page invalide" }, { status: 400 })
  }

  const result = await getInformations({ search, categorie, page })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMINISTRATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = informationSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const info = await createInformation({
    ...result.data,
    idCreateur: parseInt((session.user as any).id),
  })

  await logAudit({
    action: "CONTENT_CREATED",
    actorId: parseInt((session.user as any).id),
    targetId: info.id,
    ip: clientIp(req),
    metadata: { type: "information" },
  })

  return NextResponse.json(info, { status: 201 })
}
