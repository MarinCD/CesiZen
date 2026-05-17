import { NextResponse } from "next/server"
import { getQuestionnaires } from "@/lib/services/diagnosticService"

export async function GET() {
  const questionnaires = await getQuestionnaires()
  return NextResponse.json(questionnaires)
}
