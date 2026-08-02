import OpenAI from "openai"
import { prisma } from "./db"

export const QUALIFICATIONS_SYSTEM_PROMPT = `Eres un asistente que ayuda a armar el documento "Calificaciones, Proyectos Comparables y Términos" que Dinamita (agencia de marketing y diseño) adjunta a una propuesta comercial cuando un cliente (usualmente en una licitación o TDR formal) pide, además del precio, evidencia de experiencia: perfil de la empresa, proyectos comparables con referencias verificables, y términos y condiciones.

CÓMO FUNCIONA:
- Si el texto del documento adjunto contiene la marca "[[AVISO_TRUNCAMIENTO...]]", el archivo era más largo de lo que pudiste leer y se cortó a la mitad. Dilo de inmediato en tu primera respuesta, ANTES de cualquier otra cosa — no esperes a que el usuario pregunte. Nunca afirmes con seguridad que ya viste "todo" el documento si viste esta marca.
- Si el usuario adjunta un TDR/RFP, léelo para entender qué tipo de experiencia/expertise están pidiendo (ej. desarrollo web, producción audiovisual, comunicación con comunidades rurales, etc.) y en qué idioma está redactado.
- Vas a recibir una lista de "CASOS DE REFERENCIA DISPONIBLES" (proyectos pasados reales de Dinamita con su contacto). Sugiere cuáles 1-3 son los más comparables al pedido del cliente y por qué, y pregúntale al usuario si está de acuerdo o prefiere otros/ajustar el texto.
- Si NINGÚN caso disponible calza bien con lo pedido, dilo honestamente en vez de forzar una comparación floja, y sugiere que agregue un caso más relevante desde Configuración → Casos de referencia.
- Pregunta en qué idioma debe salir el documento (por defecto, el mismo idioma del TDR si detectas uno).
- Pregunta si los términos y condiciones estándar de Dinamita aplican tal cual, o si el proyecto necesita ajustes (ej. otra vigencia, otro número de rondas de revisión).
- Confirma todo con el usuario antes de finalizar.

TÉRMINOS Y CONDICIONES ESTÁNDAR DE REFERENCIA (ajústalos según el proyecto, no los copies literal si no aplican):
- Condiciones de pago: 50% de adelanto para iniciar, 50% de saldo contra entrega final.
- Rondas de revisión: 1 ronda de revisión/feedback incluida por entregable; rondas adicionales se cotizan aparte.
- Licencias de terceros: las librerías de stock propias de Dinamita están incluidas sin costo adicional; un asset exclusivo o premium fuera de esas suscripciones se cotiza aparte.
- Propiedad de los entregables: los archivos finales pasan a ser propiedad del cliente contra pago completo del monto acordado.
- Vigencia de la propuesta: 30 días calendario desde la fecha de emisión.
- Cronograma: los tiempos de entrega dependen de que el cliente entregue contenido, feedback y aprobaciones dentro de los plazos acordados.

ESTRUCTURA INTERNA (NO la muestres al usuario):
Cada vez que actualices el documento, incluye este bloque AL FINAL de tu mensaje:

---QUALDOC---
{"cliente":"","subtitulo":"","idioma":"es","about_text":"","casos":[{"cliente":"","servicio_titulo":"","descripcion":"","por_que_comparable":"","url":"","contacto_nombre":"","contacto_email":"","contacto_telefono":""}],"terminos":[],"completo":false}
---END---

REGLAS PARA 'subtitulo':
- Formato: "Documento de soporte a la propuesta comercial para [cliente] — [fecha]" (o en inglés: "Supporting document to the Commercial Proposal for [cliente] — [fecha]").

REGLAS PARA 'about_text':
- Usa el texto de perfil de empresa que se te da como referencia (COMPANY PROFILE), tradúcelo si el documento debe ir en otro idioma, pero no inventes cifras nuevas (años en el mercado, número de clientes) — usa las que te dieron.

REGLAS:
- Responde SIEMPRE en español en el chat (así el idioma final del documento sea otro).
- No inventes referencias de clientes que no estén en la lista de casos disponibles — solo usa las que se te dieron o las que el usuario indique explícitamente.
- Cuando el usuario confirme que está listo, marca "completo": true.`

export interface CaseStudyItem {
  cliente: string
  servicio_titulo: string
  descripcion: string
  por_que_comparable?: string
  url?: string
  contacto_nombre?: string
  contacto_email?: string
  contacto_telefono?: string
}

export interface QualificationsState {
  cliente: string
  subtitulo: string
  idioma: "es" | "en"
  about_text: string
  casos: CaseStudyItem[]
  terminos: string[]
  completo: boolean
}

export interface QualificationsChatResponse {
  text: string
  state: QualificationsState | null
}

const EMPTY_STATE: QualificationsState = {
  cliente: "",
  subtitulo: "",
  idioma: "es",
  about_text: "",
  casos: [],
  terminos: [],
  completo: false,
}

export function parseQualificationsState(content: string): { text: string; state: QualificationsState | null } {
  const match = content.match(/---QUALDOC---\n([\s\S]*?)\n---END---/)
  if (!match) return { text: content, state: null }

  try {
    const state = { ...EMPTY_STATE, ...JSON.parse(match[1]) }
    const text = content.replace(/---QUALDOC---[\s\S]*?---END---/, "").trim()
    return { text, state }
  } catch {
    return { text: content, state: null }
  }
}

async function buildSystemPrompt(): Promise<string> {
  const [profile, casos] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { id: "default" } }),
    prisma.caseStudy.findMany({ orderBy: { createdAt: "desc" } }),
  ])

  let prompt = QUALIFICATIONS_SYSTEM_PROMPT

  if (profile?.aboutText) {
    prompt += `\n\nCOMPANY PROFILE (usar como base para 'about_text'):\n${profile.aboutText}`
  }

  if (casos.length > 0) {
    const lines = casos.map((c, i) =>
      `[${i + 1}] ${c.cliente} — ${c.servicioTitulo}${c.categoria ? ` (${c.categoria})` : ""}\n  Descripción: ${c.descripcion}\n  Por qué es comparable: ${c.porQueComparable || "N/A"}\n  Contacto: ${c.contactoNombre || "N/A"} — ${c.contactoEmail || ""} ${c.contactoTelefono || ""}\n  URL: ${c.url || "N/A"}`
    )
    prompt += `\n\nCASOS DE REFERENCIA DISPONIBLES:\n${lines.join("\n\n")}`
  } else {
    prompt += `\n\nCASOS DE REFERENCIA DISPONIBLES: (ninguno cargado todavía — avísale al usuario que agregue casos desde Configuración → Casos de referencia antes de continuar).`
  }

  return prompt
}

async function getClient(userId: string): Promise<OpenAI> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { llmApiKey: true, llmBaseUrl: true },
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

export async function chatQualifications(
  messages: { role: "user" | "assistant"; content: string }[],
  userId: string
): Promise<QualificationsChatResponse> {
  const [systemContent, client, model] = await Promise.all([
    buildSystemPrompt(),
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
  return parseQualificationsState(content)
}
