import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const conversation = await prisma.conversation.findUnique({ where: { id } })

  if (!conversation || conversation.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  }

  return NextResponse.json({
    id: conversation.id,
    tipo: conversation.tipo,
    messages: JSON.parse(conversation.messages),
    state: conversation.state ? JSON.parse(conversation.state) : null,
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.conversation.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  }

  const body = await request.json()
  await prisma.conversation.update({
    where: { id },
    data: {
      messages: JSON.stringify(body.messages || []),
      state: body.state ? JSON.stringify(body.state) : null,
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.conversation.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  }

  await prisma.conversation.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
