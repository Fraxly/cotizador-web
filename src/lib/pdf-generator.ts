import { chromium } from "playwright"
import { renderQuoteHtml } from "./quote-template"
import { renderQualificationsHtml } from "./qualifications-template"
import type { QuoteData } from "./types"
import type { QualificationsState } from "./ai-qualifications"
import fs from "fs"
import path from "path"

const IMAGES_TO_EMBED: string[] = [
  "/assets/PORTADA-PROP-COMERCIAL.png",
  "/assets/logos/Isotipo blanco Dinamita@4x-8.png",
  "/assets/logos/Logo Blanco Dinamita_2@4x-8.png",
  "/assets/logos/Isotipo negro Dinamita@4x-8.png",
  "/assets/logos/Logo Negro Dinamita@4x-8.png",
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

function embedAssets(html: string): string {
  let result = html
  for (const urlPath of IMAGES_TO_EMBED) {
    const filePath = path.join(process.cwd(), "public", urlPath)
    try {
      const buffer = fs.readFileSync(filePath)
      const ext = path.extname(filePath)
      const dataUri = `data:${mimeType(ext)};base64,${buffer.toString("base64")}`
      result = result.replaceAll(urlPath, dataUri)
    } catch {
      console.warn(`Image not found: ${filePath}`)
    }
  }

  result = result.replace(/url\(["']?(\/assets\/fonts\/[^"')]+)["']?\)/g, (match, fontUrl) => {
    const filePath = path.join(process.cwd(), "public", fontUrl)
    try {
      const buffer = fs.readFileSync(filePath)
      const ext = path.extname(filePath)
      return `url(data:${mimeType(ext)};base64,${buffer.toString("base64")})`
    } catch {
      console.warn(`Font not found: ${filePath}`)
      return match
    }
  })

  return result
}

async function renderPdf(html: string, margin: { top: string; bottom: string; left: string; right: string }): Promise<Uint8Array> {
  const embeddedHtml = embedAssets(html)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(embeddedHtml, { waitUntil: "networkidle" })
    const pdfBuffer = await page.pdf({
      width: "210mm",
      height: "297mm",
      printBackground: true,
      margin,
    })
    return new Uint8Array(pdfBuffer)
  } finally {
    await browser.close()
  }
}

export async function generatePdf(data: QuoteData): Promise<Uint8Array> {
  const html = renderQuoteHtml(data)
  return renderPdf(html, { top: "0", bottom: "0", left: "0", right: "0" })
}

export async function generateQualificationsPdf(data: QualificationsState): Promise<Uint8Array> {
  const html = renderQualificationsHtml(data)
  return renderPdf(html, { top: "26mm", bottom: "18mm", left: "18mm", right: "18mm" })
}
