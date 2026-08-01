import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { extractText, isSupportedFile } from "@/lib/file-extract"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Se requiere un archivo" }, { status: 400 })
  }

  if (!isSupportedFile(file.name)) {
    return NextResponse.json({ error: "Formato no soportado. Sube un PDF, Word (.docx) o TXT." }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractText(buffer, file.name)
    return NextResponse.json({ filename: file.name, text })
  } catch (error) {
    console.error("Error extrayendo archivo:", error)
    const message = error instanceof Error ? error.message : "Error al leer el archivo"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
