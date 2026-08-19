import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  getInformationById,
  updateInformation,
  deleteInformation,
} from "@/lib/services/informationService"
import { informationSchema } from "@/lib/validations/informationSchema"
import { parseId } from "@/lib/validations/params"
import { logAudit } from "@/lib/audit"
import { clientIp } from "@/lib/rateLimit"
import * as Sentry from "@sentry/nextjs"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })

  const info = await getInformationById(id)
  if (!info) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json(info)
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMINISTRATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = informationSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })

  try {
    const info = await updateInformation(id, result.data)

    await logAudit({
      action: "CONTENT_UPDATED",
      actorId: parseInt((session.user as any).id),
      targetId: id,
      ip: clientIp(req),
      metadata: { type: "information" },
    })

    return NextResponse.json(info)
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 })
    }
    Sentry.captureException(error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMINISTRATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })

  try {
    await deleteInformation(id)

    await logAudit({
      action: "CONTENT_DELETED",
      actorId: parseInt((session.user as any).id),
      targetId: id,
      ip: clientIp(req),
      metadata: { type: "information" },
    })

    return NextResponse.json({ message: "Article supprimé" })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 })
    }
    Sentry.captureException(error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
