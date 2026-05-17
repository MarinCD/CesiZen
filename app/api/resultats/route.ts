import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getHistoriqueDiagnostics } from "@/lib/services/diagnosticService"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const utilisateurId = parseInt((session.user as any).id)
  const resultats = await getHistoriqueDiagnostics(utilisateurId)
  return NextResponse.json(resultats)
}
