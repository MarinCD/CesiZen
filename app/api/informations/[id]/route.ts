import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  getInformationById,
  updateInformation,
  deleteInformation,
} from "@/lib/services/informationService"
import { informationSchema } from "@/lib/validations/informationSchema"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const info = await getInformationById(parseInt(params.id))
  if (!info) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json(info)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMINISTRATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = informationSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const info = await updateInformation(parseInt(params.id), result.data)
  return NextResponse.json(info)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMINISTRATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  await deleteInformation(parseInt(params.id))
  return NextResponse.json({ message: "Article supprimé" })
}
