import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function CalificacionesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params
  const doc = await prisma.qualificationsDoc.findUnique({ where: { id } })

  if (!doc) redirect("/calificaciones")

  const casos = JSON.parse(doc.casos) as { cliente: string; servicio_titulo: string; descripcion: string; por_que_comparable?: string }[]
  const terminos = JSON.parse(doc.terminos) as string[]

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/calificaciones" className="text-[#86868b] hover:text-[#1d1d1f] text-sm transition-colors">← Volver</Link>
          <h1 className="text-2xl font-bold text-[#1d1d1f] mt-1">{doc.cliente}</h1>
          <p className="text-[#86868b] text-sm">{doc.numero} — {new Date(doc.createdAt).toLocaleDateString("es-PE")}</p>
        </div>
        <a
          href={`/api/qualifications/${id}/pdf`}
          target="_blank"
          className="px-4 py-2 bg-[#9568ef] hover:bg-[#7c4fdb] text-white rounded-full text-sm font-medium transition-colors"
        >
          Descargar PDF
        </a>
      </div>

      <div className="bg-white border border-[#e8e8ed] rounded-2xl p-6 space-y-6">
        <div>
          <span className="text-[#86868b] text-xs">Subtítulo</span>
          <p className="text-[#1d1d1f]">{doc.subtitulo}</p>
        </div>

        <div>
          <span className="text-[#86868b] text-xs font-medium">Casos incluidos</span>
          <div className="mt-2 space-y-3">
            {casos.map((c, i) => (
              <div key={i} className="bg-[#f5f5f7] rounded-xl p-4">
                <h4 className="font-medium text-[#1d1d1f] text-sm mb-1">{c.cliente} — {c.servicio_titulo}</h4>
                <p className="text-[#86868b] text-sm">{c.descripcion}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[#86868b] text-xs font-medium">Términos</span>
          <ul className="mt-1 space-y-0.5">
            {terminos.map((t, i) => (
              <li key={i} className="text-[#1d1d1f] text-sm">• {t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
