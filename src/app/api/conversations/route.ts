import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get("tipo")

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id, ...(tipo ? { tipo } : {}) },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(conversations)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json()
  const conversation = await prisma.conversation.create({
    data: {
      tipo: body.tipo,
      messages: JSON.stringify(body.messages || []),
      state: body.state ? JSON.stringify(body.state) : null,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ id: conversation.id })
}
