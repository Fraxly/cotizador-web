"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { labelConversation } from "@/lib/conversation-label"

interface ConversationRow {
  id: string
  tipo: string
  messages: string
  state: string | null
  updatedAt: string
}

export function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeId = searchParams.get("c")
  const [conversations, setConversations] = useState<ConversationRow[]>([])

  const load = useCallback(() => {
    fetch("/api/conversations")
      .then(r => (r.ok ? r.json() : []))
      .then(setConversations)
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
  }, [load, pathname, activeId])

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("¿Eliminar esta conversación? Esta acción no se puede deshacer.")) return
    await fetch(`/api/conversations/${id}`, { method: "DELETE" })
    load()
  }

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-[#e8e8ed] bg-white h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
      <div className="p-3 space-y-1.5 border-b border-[#e8e8ed]">
        <Link
          href="/cotizador/chat"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#eeeef0] transition-colors"
        >
          <span className="text-[#9568ef]">+</span> Nueva cotización
        </Link>
        <Link
          href="/calificaciones/chat"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#eeeef0] transition-colors"
        >
          <span className="text-[#9568ef]">+</span> Nuevo documento
        </Link>
      </div>

      <div className="flex-1 py-2">
        {conversations.length === 0 ? (
          <p className="px-4 py-3 text-xs text-[#86868b]">Sin conversaciones todavía.</p>
        ) : (
          conversations.map(c => {
            const href = c.tipo === "qualifications" ? `/calificaciones/chat?c=${c.id}` : `/cotizador/chat?c=${c.id}`
            const isActive = c.id === activeId
            return (
              <Link
                key={c.id}
                href={href}
                className={`group flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors ${
                  isActive ? "bg-[#9568ef]/10 text-[#9568ef]" : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
                }`}
              >
                <span className="truncate flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">{c.tipo === "qualifications" ? "📋" : "💰"}</span>
                  <span className="truncate">{labelConversation(c.messages, c.state)}</span>
                </span>
                <button
                  onClick={e => handleDelete(e, c.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-[#86868b] hover:text-[#e5484d] transition-opacity"
                  title="Eliminar"
                >
                  ×
                </button>
              </Link>
            )
          })
        )}
      </div>
    </aside>
  )
}
