import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"

function fmt(val: number) {
  return val.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params
  const quote = await prisma.quote.findUnique({ where: { id } })

  if (!quote || quote.userId !== session.user.id) {
    redirect("/")
  }

  const items = JSON.parse(quote.items) as { und: number; concepto: string; valor: number }[]
  const detalle = JSON.parse(quote.detalle) as { titulo: string; bullets: string[] }[]
  const condiciones = JSON.parse(quote.condiciones) as string[]
  const moneda = quote.moneda
  const simbolo = moneda === "PEN" ? "S/" : "US$"
  const subtotal = items.reduce((s: number, i: { und: number; valor: number }) => s + i.und * i.valor, 0)
  const igv = moneda === "PEN" ? subtotal * 0.18 : 0
  const total = subtotal + igv

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-[#86868b] hover:text-[#1d1d1f] text-sm transition-colors">← Volver</Link>
          <h1 className="text-2xl font-bold text-[#1d1d1f] mt-1">{quote.cliente}</h1>
          <p className="text-[#86868b] text-sm">{quote.numero} — {new Date(quote.createdAt).toLocaleDateString("es-PE")}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/quotes/${id}/pdf`}
            target="_blank"
            className="px-4 py-2 bg-[#9568ef] hover:bg-[#7c4fdb] text-white rounded-full text-sm font-medium transition-colors"
          >
            Descargar PDF
          </a>
        </div>
      </div>

      <div className="bg-white border border-[#e8e8ed] rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#86868b] text-xs">Cliente</span>
            <p className="text-[#1d1d1f] font-medium">{quote.cliente}</p>
          </div>
          <div>
            <span className="text-[#86868b] text-xs">Atención</span>
            <p className="text-[#1d1d1f]">{quote.atencion}</p>
          </div>
          <div className="col-span-2">
            <span className="text-[#86868b] text-xs">Introducción</span>
            <p className="text-[#1d1d1f]">{quote.intro}</p>
          </div>
        </div>

        <div>
          <span className="text-[#86868b] text-xs font-medium">Items</span>
          <div className="mt-2 border border-[#e8e8ed] rounded-xl overflow-hidden text-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f5f5f7] text-[#86868b] text-xs">
                  <th className="text-left px-4 py-2.5 font-medium">Und.</th>
                  <th className="text-left px-4 py-2.5 font-medium">Concepto</th>
                  <th className="text-right px-4 py-2.5 font-medium">Valor</th>
                  <th className="text-right px-4 py-2.5 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: { und: number; concepto: string; valor: number }, i: number) => (
                  <tr key={i} className="border-t border-[#e8e8ed]">
                    <td className="px-4 py-3">{item.und}</td>
                    <td className="px-4 py-3">{item.concepto}</td>
                    <td className="px-4 py-3 text-right">{simbolo} {fmt(item.valor)}</td>
                    <td className="px-4 py-3 text-right font-medium">{simbolo} {fmt(item.und * item.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ml-auto w-56 mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-[#86868b]">
              <span>Subtotal</span>
              <span>{simbolo} {fmt(subtotal)}</span>
            </div>
            {moneda === "PEN" && (
              <div className="flex justify-between text-[#86868b]">
                <span>IGV (18%)</span>
                <span>{simbolo} {fmt(igv)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-[#1d1d1f] text-base pt-1 border-t border-[#e8e8ed]">
              <span>Total</span>
              <span>{simbolo} {fmt(total)}</span>
            </div>
          </div>
        </div>

        {detalle.length > 0 && (
          <div>
            <span className="text-[#86868b] text-xs font-medium">Detalle</span>
            <div className="mt-2 space-y-3">
              {detalle.map((sec: { titulo: string; bullets: string[] }, i: number) => (
                <div key={i} className="bg-[#f5f5f7] rounded-xl p-4">
                  <h4 className="font-medium text-[#1d1d1f] text-sm mb-2">{sec.titulo}</h4>
                  <ul className="space-y-1">
                    {sec.bullets.map((b: string, j: number) => (
                      <li key={j} className="text-[#86868b] text-sm flex gap-2">
                        <span className="text-[#9568ef]">*</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {quote.tiempoProd && (
          <div>
            <span className="text-[#86868b] text-xs">Tiempo de producción</span>
            <p className="text-[#1d1d1f] font-medium">{quote.tiempoProd}</p>
          </div>
        )}

        <div>
          <span className="text-[#86868b] text-xs font-medium">Condiciones de pago</span>
          <ul className="mt-1 space-y-0.5">
            {condiciones.map((c: string, i: number) => (
              <li key={i} className="text-[#1d1d1f] text-sm">• {c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
