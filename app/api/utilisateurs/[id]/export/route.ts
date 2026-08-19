import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAudit } from "@/lib/audit"
import { clientIp } from "@/lib/rateLimit"
import { parseId } from "@/lib/validations/params"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { id } = await params
  const userId = parseId(id)
  if (userId === null) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })
  }
  const sessionUserId = parseInt((session.user as any).id)

  // L'export contient des données de santé : il reste strictement personnel.
  // Un administrateur n'y a pas accès, y compris pour instruire une demande
  // RGPD — celle-ci se traite en accompagnant la personne dans son propre espace.
  if (sessionUserId !== userId) {
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
      retoursUtilisateur: {
        select: {
          id: true,
          type: true,
          estBloquant: true,
          emplacement: true,
          pageUrl: true,
          description: true,
          statut: true,
          dateCreation: true,
          dateMiseAJour: true,
        },
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
    ip: clientIp(req),
  })

  const payload = {
    exportedAt: new Date().toISOString(),
    notice:
      "Export RGPD (article 20 — droit à la portabilité). Ce fichier contient des informations personnelles et doit être conservé en lieu sûr.",
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
