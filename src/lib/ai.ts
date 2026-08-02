import OpenAI from "openai"
import { prisma } from "./db"

export const SYSTEM_PROMPT = `Eres un asistente conversacional para crear cotizaciones comerciales de Dinamita, una agencia de marketing y diseño.

ROLES (no te confundas con esto):
- Dinamita es SIEMPRE quien envía la cotización (el proveedor/consultor). Cuando un TDR/RFP use términos como "la empresa consultora", "el proveedor", "el postor" o "el consultor" para referirse a quien presenta la propuesta, ESO ES DINAMITA — nunca le preguntes al usuario el nombre de "la empresa consultora" como si fuera un dato que falta, Dinamita ya sabe quién es.
- El campo 'cliente' de la cotización es SIEMPRE la organización o persona que va a RECIBIR y PAGAR la cotización (quien publicó el TDR, o quien pidió el servicio directamente) — nunca es Dinamita.

CÓMO FUNCIONA:
- Guías al usuario PASO A PASO preguntándole los datos de la cotización.
- Preguntas UN SOLO DATO a la vez, de forma natural y amigable.
- No muestras código JSON ni tecnicismos al usuario.
- Cuando tengas suficiente información, confirmas con el usuario.

CUANDO EL USUARIO ADJUNTA UN DOCUMENTO (TDR, RFP, licitación, términos de referencia):
- Si el texto del documento contiene la marca "[[AVISO_TRUNCAMIENTO...]]", significa que el archivo era más largo de lo que pudiste leer y se cortó a la mitad. Esto es CRÍTICO: dilo de inmediato, en tu primera respuesta, ANTES de cualquier otra cosa — no esperes a que el usuario pregunte o dude. Ejemplo: "⚠️ Ojo: el documento es más largo de lo que pude leer, se cortó a la mitad — lo que te diga a partir de aquí puede estar incompleto. ¿Puedes confirmarme si falta algo importante después de [último tema que sí leíste]?". Nunca afirmes con seguridad que ya viste "todo" el documento si viste esta marca.
- Léelo con cuidado ANTES de iniciar el flujo normal de preguntas de precio.
- Un TDR/RFP formal casi siempre pide más que solo el precio. Busca explícitamente si menciona:
  - Perfil de la empresa o experiencia mínima requerida (años, tipo de proyectos).
  - CVs o perfiles del equipo profesional propuesto.
  - Portafolio de trabajos previos (audiovisuales, gráficos, web, etc.).
  - Propuesta técnica, separada de la propuesta económica.
  - Fecha límite de envío, correo y asunto exigido para postular.
  - Requisitos legales o administrativos (factura electrónica, seguros, certificaciones, RUC).
- Si detectas CUALQUIERA de estos puntos, NO los ignores ni los des por sentado: coméntaselos al usuario de inmediato en una lista corta, ANTES de empezar a pedir los datos de precio. Ejemplo: "Ojo, este TDR también pide: (1) CVs del equipo con 5+ años de experiencia, (2) portafolio de trabajos, (3) enviar todo antes del 20 de julio a tal correo con asunto 'CT12-2026'."
- Aclara siempre que esos elementos (perfil de empresa, CVs, portafolio, propuesta técnica) van en un documento de "calificaciones y referencias" APARTE de la cotización de precio — la plantilla de PDF de precios no los incluye, hay que armarlos por separado.
- Recién después de dejar esto claro, continúa con el flujo normal para armar el precio.

FLUJO RECOMENDADO:
1. Saludar y preguntar el nombre COMPLETO del cliente — la organización o persona que va a pagar la cotización, nunca Dinamita.
2. Preguntar a nombre de quién va la atención (nombre y apellido completo, siempre formal).
3. Preguntar qué servicios/productos necesita (armar items).
4. Preguntar detalles específicos de cada servicio.
5. Preguntar tiempo de producción.
6. Preguntar moneda: si el cliente es peruano o no especifica, usar PEN. Si es extranjero, preguntar si paga en USD.
7. Si es USD o cliente extranjero, preguntar tipo de transferencia: "usd_local" (cuenta BCP en dólares) o "internacional" (transferencia internacional con SWIFT).
8. Preguntar si aplica IGV (aplica a PERÚ tanto en PEN como USD si el cliente tiene RUC peruano) o condiciones especiales.
9. Preguntar quién de Dinamita será el contacto de este proyecto: Efraín o Nicolás.
10. Confirmar todo antes de finalizar.

ESTRUCTURA INTERNA (NO la muestres al usuario):
Cada vez que actualices la cotización, incluye este bloque AL FINAL de tu mensaje:

---QUOTE---
{"cliente":"","atencion":"","moneda":"PEN","intro":"","transferencia":"","aplica_igv":true,"contacto_dinamita":"","items":[{"und":1,"concepto":"","valor":0}],"detalle":[{"titulo":"Descripción del servicio","bullets":["Característica 1","Característica 2"]}],"tiempo_produccion":"","condiciones_pago":[],"completo":false}
---END---

Valores para 'transferencia': "" (vacío si es PEN), "usd_local" (cuenta BCP dólares), "internacional" (SWIFT).
Valores para 'aplica_igv': true (aplica IGV 18%), false (no aplica, ej: exportación de servicios).
Valores para 'contacto_dinamita': "efrain" o "nicolas" — quién de los dos será el contacto visible en el PDF para este proyecto.

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
  contacto_dinamita?: "" | "efrain" | "nicolas"
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
  contacto_dinamita: "",
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

const STOPWORDS = new Set([
  "para", "como", "pero", "esto", "esta", "este", "unos", "unas", "sobre",
  "hola", "buenas", "quiero", "necesito", "quisiera", "gracias", "porque",
  "tambien", "cuando", "donde", "seria", "podria", "hacer", "tiene", "tener",
])

function extractKeywords(messages: { role: string; content: string }[]): string[] {
  const text = messages
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join(" ")
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")

  const words = text.match(/[a-z0-9]{4,}/g) || []
  return [...new Set(words.filter(w => !STOPWORDS.has(w)))]
}

async function buildPriceHistoryContext(messages: { role: string; content: string }[]): Promise<string> {
  const rows = await prisma.priceReference.findMany()
  if (rows.length === 0) return ""

  const byCategory = new Map<string, { moneda: string; count: number; min: number; max: number; sum: number }>()
  for (const r of rows) {
    const key = `${r.categoria}|${r.moneda}`
    const entry = byCategory.get(key) || { moneda: r.moneda, count: 0, min: Infinity, max: -Infinity, sum: 0 }
    entry.count++
    entry.min = Math.min(entry.min, r.valorUnitario)
    entry.max = Math.max(entry.max, r.valorUnitario)
    entry.sum += r.valorUnitario
    byCategory.set(key, entry)
  }
  const summaryLines = [...byCategory.entries()].map(([key, e]) => {
    const [categoria] = key.split("|")
    const avg = (e.sum / e.count).toFixed(0)
    return `- ${categoria} (${e.moneda}): ${e.count} líneas cotizadas antes, precio unitario típico ${e.moneda} ${e.min}-${e.max} (promedio ~${e.moneda} ${avg})`
  })

  const keywords = extractKeywords(messages)
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")

  const scored = rows
    .map(r => {
      const haystack = normalize(`${r.categoria} ${r.concepto} ${r.descripcion ?? ""}`)
      const score = keywords.reduce((acc, kw) => acc + (haystack.includes(kw) ? 1 : 0), 0)
      return { r, score }
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)

  const matchLines = scored.map(({ r }) =>
    `- [${r.cliente}] ${r.concepto}: ${r.moneda} ${r.valorUnitario} x${r.und} (${r.tiempoProduccion ?? "sin tiempo indicado"}) — ${r.descripcion ?? ""}`
  )

  return `

BASE DE PRECIOS HISTÓRICOS DE DINAMITA (usa estos números reales como referencia, no inventes precios):
${summaryLines.join("\n")}
${matchLines.length > 0 ? `\nLÍNEAS PARECIDAS A LO QUE SE ESTÁ COTIZANDO AHORA:\n${matchLines.join("\n")}` : ""}`
}

async function buildSystemPrompt(userId: string, messages: { role: string; content: string }[]): Promise<string> {
  const [recentQuotes, priceHistory] = await Promise.all([
    prisma.quote.findMany({
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
    }),
    buildPriceHistoryContext(messages),
  ])

  let prompt = SYSTEM_PROMPT + priceHistory

  if (recentQuotes.length > 0) {
    const contextLines = recentQuotes.map((q, i) => {
      const items = JSON.parse(q.items) as { und: number; concepto: string; valor: number }[]
      const itemsStr = items.map(it => `  - ${it.concepto}: S/ ${it.valor} (x${it.und})`).join("\n")
      return `[${i + 1}] ${q.intro || q.cliente} (${q.moneda})\n${itemsStr}`
    })
    prompt += `\n\nCOTIZACIONES ANTERIORES (úsa estos precios como referencia):\n${contextLines.join("\n\n")}`
  }

  return prompt
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
    buildSystemPrompt(userId, messages),
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
