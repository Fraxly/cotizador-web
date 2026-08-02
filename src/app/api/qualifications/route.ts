import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const docs = await prisma.qualificationsDoc.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, numero: true, cliente: true, createdAt: true },
  })

  return NextResponse.json(docs)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json()
  const doc = await prisma.qualificationsDoc.create({
    data: {
      numero: body.numero || `QDOC${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      cliente: body.cliente,
      subtitulo: body.subtitulo,
      idioma: body.idioma || "es",
      aboutText: body.about_text,
      casos: JSON.stringify(body.casos || []),
      terminos: JSON.stringify(body.terminos || []),
      userId: session.user.id,
    },
  })

  return NextResponse.json({ id: doc.id, numero: doc.numero })
}
