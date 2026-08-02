import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { chatQualifications } from "@/lib/ai-qualifications"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Se requiere array de messages" }, { status: 400 })
    }

    const userId = session.user.id
    if (!userId) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 })

    const result = await chatQualifications(messages, userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error en chat de calificaciones:", error)
    const message = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
