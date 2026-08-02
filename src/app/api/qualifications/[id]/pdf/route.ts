import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { generateQualificationsPdf } from "@/lib/pdf-generator"
import type { QualificationsState } from "@/lib/ai-qualifications"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const doc = await prisma.qualificationsDoc.findUnique({ where: { id } })

  if (!doc) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const data: QualificationsState = {
    cliente: doc.cliente,
    subtitulo: doc.subtitulo,
    idioma: (doc.idioma as "es" | "en") || "es",
    about_text: doc.aboutText,
    casos: JSON.parse(doc.casos || "[]"),
    terminos: JSON.parse(doc.terminos || "[]"),
    completo: true,
  }

  try {
    const pdf = await generateQualificationsPdf(data)
    // @ts-expect-error BodyInit type mismatch in Node.js 24
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="calificaciones-${doc.numero}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generando PDF de calificaciones:", error)
    return NextResponse.json({ error: "Error al generar PDF" }, { status: 500 })
  }
}
