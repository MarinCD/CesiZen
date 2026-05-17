import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getInformations, createInformation } from "@/lib/services/informationService"
import { informationSchema } from "@/lib/validations/informationSchema"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || undefined
  const categorie = searchParams.get("categorie") || undefined
  const page = parseInt(searchParams.get("page") || "1")

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
  return NextResponse.json(info, { status: 201 })
}
