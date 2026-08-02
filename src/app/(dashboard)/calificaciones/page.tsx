import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import DeleteButton from "@/components/DeleteButton"

export default async function CalificacionesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const docs = await prisma.qualificationsDoc.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, numero: true, cliente: true, createdAt: true },
  })

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1d1f]">Calificaciones y Términos</h1>
          <p className="text-[#86868b] text-sm mt-1">
            {docs.length} {docs.length === 1 ? "documento creado" : "documentos creados"}
          </p>
        </div>
        <Link
          href="/calificaciones/chat"
          className="inline-flex items-center px-5 py-2.5 bg-[#9568ef] hover:bg-[#7c4fdb] text-white rounded-full text-sm font-medium transition-colors"
        >
          <svg className="mr-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Nuevo documento
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <p className="text-[#86868b] mb-4">No tienes documentos de calificaciones aún</p>
          <Link
            href="/calificaciones/chat"
            className="text-[#9568ef] hover:text-[#7c4fdb] underline text-sm"
          >
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <Link
              key={d.id}
              href={`/calificaciones/${d.id}`}
              className="block p-4 bg-white border border-[#e8e8ed] rounded-xl hover:border-[#d2d2d7] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#86868b] text-xs font-mono">{d.numero}</span>
                  <h3 className="font-medium text-[#1d1d1f] mt-0.5">{d.cliente}</h3>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#86868b]">
                  <span>{new Date(d.createdAt).toLocaleDateString("es-PE")}</span>
                  <DeleteButton
                    endpoint={`/api/qualifications/${d.id}`}
                    confirmLabel={`¿Eliminar el documento de "${d.cliente}"? Esta acción no se puede deshacer.`}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
