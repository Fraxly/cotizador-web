import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const quotes = await prisma.quote.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      numero: true,
      cliente: true,
      moneda: true,
      createdAt: true,
    },
  })

  return NextResponse.json(quotes)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json()
  const quote = await prisma.quote.create({
    data: {
      numero: body.numero_propuesta,
      cliente: body.cliente,
      atencion: body.atencion,
      emitido: body.emitido,
      fechaCorta: body.fecha_corta,
      anio: body.anio,
      moneda: body.moneda || "PEN",
      intro: body.intro,
      items: JSON.stringify(body.items),
      detalle: JSON.stringify(body.detalle || []),
      tiempoProd: body.tiempo_produccion || null,
      condiciones: JSON.stringify(body.condiciones_pago || []),
      contactoDinamita: body.contacto_dinamita || null,
      transferencia: body.transferencia || null,
      aplicaIgv: body.aplica_igv ?? true,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ id: quote.id, numero: quote.numero })
}
