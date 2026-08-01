import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { generatePdf } from "@/lib/pdf-generator"
import type { QuoteData } from "@/lib/types"

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

  const data: QuoteData = {
    numero_propuesta: quote.numero,
    cliente: quote.cliente || "",
    atencion: quote.atencion || "",
    emitido: quote.emitido || "",
    fecha_corta: quote.fechaCorta || "",
    anio: quote.anio || "",
    moneda: quote.moneda as "PEN" | "USD",
    intro: quote.intro || `Propuesta comercial para ${quote.cliente || "nuestro cliente"}`,
    items: JSON.parse(quote.items || "[]"),
    detalle: JSON.parse(quote.detalle || "[]"),
    tiempo_produccion: quote.tiempoProd || undefined,
    condiciones_pago: JSON.parse(quote.condiciones || "[]"),
    transferencia: (quote.transferencia || undefined) as "pen" | "usd_local" | "internacional" | undefined,
    aplica_igv: quote.aplicaIgv,
  }

  try {
    const pdf = await generatePdf(data)
    // @ts-expect-error BodyInit type mismatch in Node.js 24
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cotizacion-${quote.numero}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generando PDF:", error)
    return NextResponse.json({ error: "Error al generar PDF" }, { status: 500 })
  }
}
