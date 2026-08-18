import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  getQuestionnaireById,
  getQuestionnaireAvecBareme,
} from "@/lib/services/diagnosticService"
import { parseId } from "@/lib/validations/params"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })

  // Seul le back-office reçoit le barème : côté public, la pondération des
  // questions n'est jamais servie.
  const session = await getServerSession(authOptions)
  const isAdmin = (session?.user as any)?.role === "ADMINISTRATEUR"

  const questionnaire = isAdmin
    ? await getQuestionnaireAvecBareme(id)
    : await getQuestionnaireById(id)
  if (!questionnaire) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json(questionnaire)
}
