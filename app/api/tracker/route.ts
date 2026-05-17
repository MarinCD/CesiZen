import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTrackerEmotions, addTrackerEmotion } from "@/lib/services/trackerService"
import { trackerSchema } from "@/lib/validations/diagnosticSchema"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const utilisateurId = parseInt((session.user as any).id)
  const days = parseInt(new URL(req.url).searchParams.get("days") || "30")

  const emotions = await getTrackerEmotions(utilisateurId, days)
  return NextResponse.json(emotions)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await req.json()
  const result = trackerSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const utilisateurId = parseInt((session.user as any).id)
  const emotion = await addTrackerEmotion({ ...result.data, utilisateurId })
  return NextResponse.json(emotion, { status: 201 })
}
