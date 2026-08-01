import OpenAI from "openai"
import { prisma } from "./db"

export const SYSTEM_PROMPT = `Eres un asistente conversacional para crear cotizaciones comerciales de Dinamita, una agencia de marketing y diseño.

CÓMO FUNCIONA:
- Guías al usuario PASO A PASO preguntándole los datos de la cotización.
- Preguntas UN SOLO DATO a la vez, de forma natural y amigable.
- No muestras código JSON ni tecnicismos al usuario.
- Cuando tengas suficiente información, confirmas con el usuario.

FLUJO RECOMENDADO:
1. Saludar y preguntar el nombre COMPLETO del cliente (nombres y apellidos).
2. Preguntar a nombre de quién va la atención (nombre y apellido completo, siempre formal).
3. Preguntar qué servicios/productos necesita (armar items).
4. Preguntar detalles específicos de cada servicio.
5. Preguntar tiempo de producción.
6. Preguntar moneda: si el cliente es peruano o no especifica, usar PEN. Si es extranjero, preguntar si paga en USD.
7. Si es USD o cliente extranjero, preguntar tipo de transferencia: "usd_local" (cuenta BCP en dólares) o "internacional" (transferencia internacional con SWIFT).
8. Preguntar si aplica IGV (aplica a PERÚ tanto en PEN como USD si el cliente tiene RUC peruano) o condiciones especiales.
9. Confirmar todo antes de finalizar.

ESTRUCTURA INTERNA (NO la muestres al usuario):
Cada vez que actualices la cotización, incluye este bloque AL FINAL de tu mensaje:

---QUOTE---
{"cliente":"","atencion":"","moneda":"PEN","intro":"","transferencia":"","aplica_igv":true,"items":[{"und":1,"concepto":"","valor":0}],"detalle":[{"titulo":"Descripción del servicio","bullets":["Característica 1","Característica 2"]}],"tiempo_produccion":"","condiciones_pago":[],"completo":false}
---END---

Valores para 'transferencia': "" (vacío si es PEN), "usd_local" (cuenta BCP dólares), "internacional" (SWIFT).
Valores para 'aplica_igv': true (aplica IGV 18%), false (no aplica, ej: exportación de servicios).

REGLAS PARA 'intro':
- El campo 'intro' debe ser un título descriptivo siguiendo este formato:
  "Propuesta comercial para [servicio principal] de [cliente/marca]"
  "Propuesta comercial para [servicio principal] de la marca [cliente]"
  "Propuesta comercial designada a [servicio principal] de [cliente]"
- Ejemplos: "Propuesta comercial para el desarrollo de sitio web de la marca Estudio Olaechea"
  "Propuesta comercial designada a la producción audiovisual de la campaña de prospección de la marca CSTI"
- Sé específico con el servicio y siempre incluye el nombre del cliente o marca.

REGLAS PARA 'detalle':
- Por cada servicio en 'items', crea una sección en 'detalle' con su descripción y bullets.
- El 'titulo' debe coincidir con el 'concepto' del item correspondiente.
- Los 'bullets' son las características/alcances específicos de ese servicio (mínimo 3).
- Ejemplo: si items tiene "Diseño web", en detalle pon bullets como "Interfaz responsive", "Optimización SEO", "Panel administrador", etc.

REGLAS:
- Responde SIEMPRE en español, en tono conversacional y profesional.
- Los precios deben ser realistas para el mercado peruano. USA LAS COTIZACIONES ANTERIORES como referencia de precios.
- Si el cliente es extranjero, sugiere USD e indica que se mostrarán datos para transferencia internacional (SWIFT).
- Cuando el usuario confirme que está listo, marca "completo": true.`

export interface QuoteState {
  cliente: string
  atencion: string
  moneda: "PEN" | "USD"
  intro: string
  items: { und: number; concepto: string; valor: number }[]
  detalle: { titulo: string; bullets: string[] }[]
  tiempo_produccion: string
  condiciones_pago: string[]
  transferencia?: "" | "usd_local" | "internacional"
  aplica_igv?: boolean
  completo: boolean
}

export interface ChatResponse {
  text: string
  state: QuoteState | null
}

const EMPTY_STATE: QuoteState = {
  cliente: "",
  atencion: "",
  moneda: "PEN",
  intro: "",
  items: [],
  detalle: [],
  tiempo_produccion: "",
  condiciones_pago: [],
  transferencia: "",
  aplica_igv: true,
  completo: false,
}

export function parseQuoteState(content: string): { text: string; state: QuoteState | null } {
  const match = content.match(/---QUOTE---\n([\s\S]*?)\n---END---/)
  if (!match) return { text: content, state: null }

  try {
    const state = { ...EMPTY_STATE, ...JSON.parse(match[1]) }
    const text = content.replace(/---QUOTE---[\s\S]*?---END---/, "").trim()
    return { text, state }
  } catch {
    return { text: content, state: null }
  }
}

async function buildSystemPrompt(userId: string): Promise<string> {
  const recentQuotes = await prisma.quote.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      cliente: true,
      intro: true,
      items: true,
      moneda: true,
      createdAt: true,
    },
  })

  if (recentQuotes.length === 0) return SYSTEM_PROMPT

  const contextLines = recentQuotes.map((q, i) => {
    const items = JSON.parse(q.items) as { und: number; concepto: string; valor: number }[]
    const itemsStr = items.map(it => `  - ${it.concepto}: S/ ${it.valor} (x${it.und})`).join("\n")
    return `[${i + 1}] ${q.intro || q.cliente} (${q.moneda})\n${itemsStr}`
  })

  return `${SYSTEM_PROMPT}

COTIZACIONES ANTERIORES (úsa estos precios como referencia):
${contextLines.join("\n\n")}`
}

async function getClient(userId: string): Promise<OpenAI> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { llmApiKey: true, llmModel: true, llmBaseUrl: true },
  })

  return new OpenAI({
    baseURL: user?.llmBaseUrl || process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey: user?.llmApiKey || process.env.OPENROUTER_API_KEY || "",
  })
}

async function getModel(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { llmModel: true },
  })
  return user?.llmModel || process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-pro"
}

export async function chat(
  messages: { role: "user" | "assistant"; content: string }[],
  userId: string
): Promise<ChatResponse> {
  const [systemContent, client, model] = await Promise.all([
    buildSystemPrompt(userId),
    getClient(userId),
    getModel(userId),
  ])

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemContent },
      ...messages,
    ],
    stream: false,
  })

  const content = response.choices[0]?.message?.content || ""
  return parseQuoteState(content)
}
