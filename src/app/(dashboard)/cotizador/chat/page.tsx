"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { QuoteState } from "@/lib/ai"

interface Message {
  role: "user" | "assistant"
  content: string
  displayContent?: string
}

function formatPrice(val: number, moneda: string) {
  const s = moneda === "PEN" ? "S/" : "US$"
  return `${s} ${val.toLocaleString("es-PE")}`
}

function QuoteSummary({ state }: { state: QuoteState }) {
  const total = state.items.reduce((s, i) => s + i.und * i.valor, 0)
  const igv = state.moneda === "PEN" ? total * 0.18 : 0
  const granTotal = total + igv

  if (!state.cliente && state.items.length === 0) return null

  return (
    <div className="bg-[#f5f5f7] rounded-2xl p-5 space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#1d1d1f]">Cotización</h3>
        <span className="text-[#86868b] text-xs">
          {state.completo ? "✅ Lista" : "🔄 En progreso"}
        </span>
      </div>

      {state.cliente && (
        <div>
          <span className="text-[#86868b] text-xs">Cliente</span>
          <p className="text-[#1d1d1f] font-medium">{state.cliente}</p>
        </div>
      )}

      {state.items.length > 0 && (
        <div>
          <span className="text-[#86868b] text-xs">Items ({state.items.length})</span>
          <div className="mt-1.5 space-y-1.5">
            {state.items.map((item, i) => (
              <div key={i} className="flex justify-between text-[#1d1d1f]">
                <span className="truncate mr-2">{item.und}× {item.concepto}</span>
                <span className="font-medium whitespace-nowrap">{formatPrice(item.valor, state.moneda)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {total > 0 && (
        <div className="border-t border-[#d2d2d7] pt-3 space-y-1">
          <div className="flex justify-between text-[#86868b]">
            <span>Subtotal</span>
            <span>{formatPrice(total, state.moneda)}</span>
          </div>
          {state.moneda === "PEN" && (
            <div className="flex justify-between text-[#86868b]">
              <span>IGV (18%)</span>
              <span>{formatPrice(igv, state.moneda)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-[#1d1d1f] text-base pt-1">
            <span>Total</span>
            <span>{formatPrice(granTotal, state.moneda)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu asistente para crear cotizaciones de **Dinamita**. Voy a guiarte paso a paso.\n\nPara empezar, ¿cuál es el **nombre del cliente**?",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [quoteState, setQuoteState] = useState<QuoteState | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendContent = useCallback(async (content: string, displayContent?: string) => {
    if (!content.trim() || loading) return

    setMessages(prev => [...prev, { role: "user", content, displayContent }])
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages,
            { role: "user", content },
          ].map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error ${res.status}`)
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.text || "" }])

      if (data.state) {
        setQuoteState(data.state)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de conexión"
      setMessages(prev => [...prev, { role: "assistant", content: `❌ **Error:** ${msg}` }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages])

  const [attachedFile, setAttachedFile] = useState<{ filename: string; text: string } | null>(null)

  const sendMessage = useCallback(() => {
    const comment = input.trim()
    if (!comment && !attachedFile) return

    setInput("")
    const file = attachedFile
    setAttachedFile(null)

    if (file) {
      const content = `He adjuntado el documento "${file.filename}". Este es su contenido:\n\n"""\n${file.text}\n"""` +
        (comment ? `\n\nComentario: ${comment}` : "")
      const displayContent = `📎 ${file.filename}` + (comment ? `\n${comment}` : "")
      sendContent(content, displayContent)
    } else {
      sendContent(comment)
    }
  }, [input, attachedFile, sendContent])

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || loading || uploading) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/chat/extract", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Error al leer el archivo")

      setAttachedFile({ filename: data.filename, text: data.text })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al leer el archivo"
      setMessages(prev => [...prev, { role: "assistant", content: `❌ **Error:** ${msg}` }])
    } finally {
      setUploading(false)
    }
  }

  async function handleGeneratePdf() {
    if (!quoteState || quoteState.items.length === 0) return
    setGeneratingPdf(true)

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero_propuesta: `DIN${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          cliente: quoteState.cliente || "Sin cliente",
          atencion: quoteState.atencion || quoteState.cliente || "Sin cliente",
          emitido: new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" }),
          fecha_corta: `${new Date().getDate()}/${new Date().getMonth() + 1}`,
          anio: String(new Date().getFullYear()),
          moneda: quoteState.moneda,
          intro: quoteState.intro || `Propuesta comercial para ${quoteState.cliente}`,
          items: quoteState.items,
          detalle: quoteState.detalle,
          tiempo_produccion: quoteState.tiempo_produccion,
          transferencia: quoteState.transferencia || undefined,
          aplica_igv: quoteState.aplica_igv ?? (quoteState.moneda === "PEN"),
          contacto_dinamita: quoteState.contacto_dinamita || "efrain",
          condiciones_pago: quoteState.condiciones_pago.length > 0 ? quoteState.condiciones_pago : ["50% de adelanto para iniciar", "50% de saldo contra entrega"],
        }),
      })

      if (!res.ok) throw new Error("Error al guardar")

      const { id } = await res.json()
      window.open(`/api/quotes/${id}/pdf`, "_blank")
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "✅ **¡PDF generado!** Puedes descargarlo desde la ventana que se abrió.",
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Error al generar el PDF. Intenta de nuevo.",
      }])
    } finally {
      setGeneratingPdf(false)
    }
  }

  function formatMessage(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>")
  }

  const canGeneratePdf = quoteState?.completo && quoteState.items.length > 0

  return (
    <div className="h-[calc(100vh-56px)] flex">
      <div className="flex-1 flex flex-col max-w-screen-xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[#9568ef] flex items-center justify-center text-white text-xs font-bold mr-2 mt-0.5 shrink-0">
                    D
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#9568ef] text-white rounded-br-md"
                      : "bg-[#f5f5f7] text-[#1d1d1f] rounded-bl-md"
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.displayContent ?? msg.content) }}
                />
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-[#9568ef] flex items-center justify-center text-white text-xs font-bold mr-2 mt-0.5 shrink-0">
                  D
                </div>
                <div className="bg-[#f5f5f7] rounded-2xl rounded-bl-md px-5 py-3.5">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-[#9568ef]/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-[#9568ef]/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-[#9568ef]/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t border-[#e8e8ed] bg-white px-4 py-3">
          {attachedFile && (
            <div className="max-w-2xl mx-auto mb-2">
              <div className="inline-flex items-center gap-2 bg-[#f5f5f7] rounded-full pl-3 pr-2 py-1.5 text-xs text-[#1d1d1f]">
                <span>📎 {attachedFile.filename}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="w-4 h-4 rounded-full bg-[#d2d2d7] hover:bg-[#b8b8bd] flex items-center justify-center text-[10px] leading-none"
                  title="Quitar archivo"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileSelected}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploading}
              title="Adjuntar PDF, Word o TXT"
              className="w-10 h-10 rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
            >
              {uploading ? (
                <span className="w-3.5 h-3.5 border-2 border-[#9568ef] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a1.5 1.5 0 01-2.12-2.12l8.49-8.48" />
                </svg>
              )}
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder={attachedFile ? "Agrega un comentario (opcional)..." : "Escribe tu respuesta..."}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#f5f5f7] rounded-full text-[15px] text-[#1d1d1f] placeholder-[#86868b] outline-none focus:ring-2 focus:ring-[#9568ef]/30 transition-shadow"
            />
            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && !attachedFile)}
              className="w-10 h-10 rounded-full bg-[#9568ef] hover:bg-[#7c4fdb] disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="w-80 border-l border-[#e8e8ed] bg-white p-5 hidden lg:block overflow-y-auto">
        <div className="space-y-5">
          <QuoteSummary state={quoteState || { cliente: "", atencion: "", moneda: "PEN", intro: "", items: [], detalle: [], tiempo_produccion: "", condiciones_pago: [], completo: false }} />

          {canGeneratePdf && (
            <button
              onClick={handleGeneratePdf}
              disabled={generatingPdf}
              className="w-full py-2.5 bg-[#9568ef] hover:bg-[#7c4fdb] disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors"
            >
              {generatingPdf ? "Generando..." : "Descargar PDF"}
            </button>
          )}

          {quoteState && !quoteState.completo && quoteState.items.length > 0 && (
            <div className="bg-[#f5f5f7] rounded-xl p-4 text-center text-[#86868b] text-sm">
              ¿Listo? Pide confirmar para generar el PDF.
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => router.push("/")}
              className="text-[#86868b] hover:text-[#1d1d1f] text-xs transition-colors"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
