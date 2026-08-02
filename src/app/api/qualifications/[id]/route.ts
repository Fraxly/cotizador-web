import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.qualificationsDoc.findUnique({ where: { id } })

  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  await prisma.qualificationsDoc.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
