"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function DeleteQuoteButton({ id, cliente }: { id: string; cliente: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`¿Eliminar la cotización de "${cliente}"? Esta acción no se puede deshacer.`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      alert("No se pudo eliminar la cotización. Intenta de nuevo.")
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      title="Eliminar cotización"
      className="w-8 h-8 rounded-full hover:bg-[#fde8e8] disabled:opacity-40 flex items-center justify-center text-[#86868b] hover:text-[#e5484d] transition-colors shrink-0"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    </button>
  )
}
