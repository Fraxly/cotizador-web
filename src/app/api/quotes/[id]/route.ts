import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const quote = await prisma.quote.findUnique({ where: { id } })

  if (!quote || quote.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  }

  return NextResponse.json({
    id: quote.id,
    numero_propuesta: quote.numero,
    cliente: quote.cliente,
    atencion: quote.atencion,
    emitido: quote.emitido,
    fecha_corta: quote.fechaCorta,
    anio: quote.anio,
    moneda: quote.moneda,
    intro: quote.intro,
    items: JSON.parse(quote.items),
    detalle: JSON.parse(quote.detalle),
    tiempo_produccion: quote.tiempoProd,
    condiciones_pago: JSON.parse(quote.condiciones),
    transferencia: quote.transferencia,
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.quote.findUnique({ where: { id } })

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  }

  const body = await request.json()
  const quote = await prisma.quote.update({
    where: { id },
    data: {
      numero: body.numero_propuesta,
      cliente: body.cliente,
      atencion: body.atencion,
      emitido: body.emitido,
      fechaCorta: body.fecha_corta,
      anio: body.anio,
      moneda: body.moneda,
      intro: body.intro,
      items: JSON.stringify(body.items),
      detalle: JSON.stringify(body.detalle || []),
      tiempoProd: body.tiempo_produccion || null,
      condiciones: JSON.stringify(body.condiciones_pago || []),
      transferencia: body.transferencia || null,
    },
  })

  return NextResponse.json({ id: quote.id })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.quote.findUnique({ where: { id } })

  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  }

  await prisma.quote.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
