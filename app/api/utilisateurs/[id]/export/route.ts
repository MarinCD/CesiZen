import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const userId = parseInt(params.id)
  const sessionUserId = parseInt((session.user as any).id)
  const isAdmin = (session.user as any).role === "ADMINISTRATEUR"

  if (sessionUserId !== userId && !isAdmin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      dateCreation: true,
      consentementRGPD: true,
      resultatsDiagnostic: {
        select: {
          id: true,
          dateRealisation: true,
          score: true,
          interpretation: true,
          diagnostic: { select: { nom: true } },
        },
      },
      informations: {
        select: { id: true, titre: true, categorie: true, datePublication: true },
      },
    },
  })

  if (!utilisateur) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  }

  await logAudit({
    action: "EXPORT_USER_DATA",
    actorId: sessionUserId,
    targetId: userId,
    ip: req.headers.get("x-forwarded-for") || null,
  })

  const payload = {
    exportedAt: new Date().toISOString(),
    notice:
      "Export RGPD (article 20 — droit à la portabilité). Ces données contiennent des informations relatives à votre santé : conservez-les en lieu sûr.",
    utilisateur,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="cesizen-export-utilisateur-${userId}-${new Date().toISOString().split("T")[0]}.json"`,
    },
  })
}
