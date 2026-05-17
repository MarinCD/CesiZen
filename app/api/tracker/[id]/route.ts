import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteTrackerEmotion } from "@/lib/services/trackerService"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const utilisateurId = parseInt((session.user as any).id)

  try {
    await deleteTrackerEmotion(parseInt(params.id), utilisateurId)
    return NextResponse.json({ message: "Entrée supprimée" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
