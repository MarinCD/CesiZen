import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getQuestionnaires } from "@/lib/services/diagnosticService"

export async function GET() {
  const questionnaires = await getQuestionnaires()
  return NextResponse.json(questionnaires)
}
