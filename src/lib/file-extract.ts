import path from "path"

export const MAX_EXTRACT_CHARS = 12000

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt"]

export function isSupportedFile(filename: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(path.extname(filename).toLowerCase())
}

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase()
  let text: string

  if (ext === ".pdf") {
    const { PDFParse } = await import("pdf-parse")
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    const result = await parser.getText()
    await parser.destroy()
    text = result.text
  } else if (ext === ".docx") {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    text = result.value
  } else if (ext === ".txt") {
    text = buffer.toString("utf-8")
  } else {
    throw new Error("Formato no soportado. Sube un PDF, Word (.docx) o TXT.")
  }

  text = text.trim()
  if (text.length > MAX_EXTRACT_CHARS) {
    text = text.slice(0, MAX_EXTRACT_CHARS) + "\n\n[...documento truncado por longitud, esto es solo una parte...]"
  }

  return text
}
