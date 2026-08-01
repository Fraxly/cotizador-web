import { chromium } from "playwright"
import { renderQuoteHtml } from "./quote-template"
import type { QuoteData } from "./types"
import fs from "fs"
import path from "path"

const ASSETS_DIR = path.join(process.cwd(), "public", "assets")

const IMAGES_TO_EMBED: [string, string][] = [
  ["/assets/PORTADA-PROP-COMERCIAL.png", "image/png"],
  ["/assets/logos/Isotipo blanco Dinamita@4x-8.png", "image/png"],
  ["/assets/logos/Logo Blanco Dinamita_2@4x-8.png", "image/png"],
  ["/assets/logos/Isotipo negro Dinamita@4x-8.png", "image/png"],
]

function mimeType(ext: string): string {
  const map: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".otf": "font/otf",
    ".ttf": "font/ttf",
  }
  return map[ext.toLowerCase()] || "application/octet-stream"
}

function embedImages(html: string): string {
  let result = html
  for (const [urlPath, _mime] of IMAGES_TO_EMBED) {
    const filePath = path.join(process.cwd(), "public", urlPath)
    try {
      const buffer = fs.readFileSync(filePath)
      const ext = path.extname(filePath)
      const b64 = buffer.toString("base64")
      const dataUri = `data:${mimeType(ext)};base64,${b64}`
      result = result.replaceAll(urlPath, dataUri)
    } catch {
      console.warn(`Image not found: ${filePath}`)
    }
  }
  return result
}

export async function generatePdf(data: QuoteData): Promise<Uint8Array> {
  let html = renderQuoteHtml(data)
  html = embedImages(html)
  html = html.replace(/url\(["']?(\/assets\/fonts\/[^"')]+)["']?\)/g, (_match, fontUrl) => {
    const filePath = path.join(process.cwd(), "public", fontUrl)
    try {
      const buffer = fs.readFileSync(filePath)
      const ext = path.extname(filePath)
      return `url(data:${mimeType(ext)};base64,${buffer.toString("base64")})`
    } catch {
      console.warn(`Font not found: ${filePath}`)
      return _match
    }
  })

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle" })
    const pdfBuffer = await page.pdf({
      width: "210mm",
      height: "297mm",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    })
    return new Uint8Array(pdfBuffer)
  } finally {
    await browser.close()
  }
}
