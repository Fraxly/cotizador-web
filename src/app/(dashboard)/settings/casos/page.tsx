import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import Link from "next/link"
import DeleteButton from "@/components/DeleteButton"

export default async function CasosSettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [profile, casos] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { id: "default" } }),
    prisma.caseStudy.findMany({ orderBy: { createdAt: "desc" } }),
  ])

  async function saveProfile(formData: FormData) {
    "use server"
    const sess = await auth()
    if (!sess?.user?.id) return

    const aboutText = (formData.get("aboutText") as string) || ""
    await prisma.companyProfile.upsert({
      where: { id: "default" },
      update: { aboutText },
      create: { id: "default", aboutText },
    })

    revalidatePath("/settings/casos")
  }

  async function addCaseStudy(formData: FormData) {
    "use server"
    const sess = await auth()
    if (!sess?.user?.id) return

    await prisma.caseStudy.create({
      data: {
        cliente: (formData.get("cliente") as string) || "",
        servicioTitulo: (formData.get("servicioTitulo") as string) || "",
        descripcion: (formData.get("descripcion") as string) || "",
        porQueComparable: (formData.get("porQueComparable") as string) || null,
        url: (formData.get("url") as string) || null,
        contactoNombre: (formData.get("contactoNombre") as string) || null,
        contactoEmail: (formData.get("contactoEmail") as string) || null,
        contactoTelefono: (formData.get("contactoTelefono") as string) || null,
        categoria: (formData.get("categoria") as string) || null,
      },
    })

    revalidatePath("/settings/casos")
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link href="/settings" className="text-[#86868b] hover:text-[#1d1d1f] text-sm transition-colors">← Configuración</Link>
      <h1 className="text-2xl font-bold text-[#1d1d1f] mt-1 mb-1">Casos de referencia</h1>
      <p className="text-[#86868b] text-sm mb-10">
        Perfil de empresa y proyectos comparables que usa el chat de &quot;Calificaciones&quot; para armar documentos de licitación.
      </p>

      <form action={saveProfile} className="bg-white border border-[#e8e8ed] rounded-2xl p-6 space-y-4 mb-8">
        <h2 className="font-medium text-[#1d1d1f]">Perfil de la empresa</h2>
        <textarea
          name="aboutText"
          rows={5}
          defaultValue={profile?.aboutText || ""}
          placeholder="Dinamita is a boutique marketing and design agency..."
          className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#9568ef]/30 focus:border-[#9568ef] transition-all"
        />
        <button
          type="submit"
          className="px-5 py-2 bg-[#9568ef] hover:bg-[#7c4fdb] text-white rounded-xl text-sm font-medium transition-colors"
        >
          Guardar perfil
        </button>
      </form>

      <h2 className="font-medium text-[#1d1d1f] mb-3">Proyectos comparables ({casos.length})</h2>
      <div className="space-y-2 mb-8">
        {casos.map(c => (
          <div key={c.id} className="flex items-center justify-between p-4 bg-white border border-[#e8e8ed] rounded-xl">
            <div>
              <p className="font-medium text-[#1d1d1f] text-sm">{c.cliente} — {c.servicioTitulo}</p>
              <p className="text-[#86868b] text-xs mt-0.5">{c.contactoNombre} {c.contactoEmail ? `— ${c.contactoEmail}` : ""}</p>
            </div>
            <DeleteButton
              endpoint={`/api/case-studies/${c.id}`}
              confirmLabel={`¿Eliminar el caso de "${c.cliente}"?`}
            />
          </div>
        ))}
        {casos.length === 0 && (
          <p className="text-[#86868b] text-sm">Todavía no hay casos cargados.</p>
        )}
      </div>

      <h2 className="font-medium text-[#1d1d1f] mb-3">Agregar caso nuevo</h2>
      <form action={addCaseStudy} className="bg-white border border-[#e8e8ed] rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input name="cliente" placeholder="Cliente" required className="px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm" />
          <input name="servicioTitulo" placeholder="Servicio (ej. Full Website Design)" required className="px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm" />
        </div>
        <textarea name="descripcion" placeholder="Descripción del proyecto" required rows={3} className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm" />
        <textarea name="porQueComparable" placeholder="Por qué es comparable (opcional)" rows={2} className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm" />
        <div className="grid grid-cols-2 gap-4">
          <input name="url" placeholder="URL del proyecto (opcional)" className="px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm" />
          <input name="categoria" placeholder="Categoría (opcional)" className="px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <input name="contactoNombre" placeholder="Nombre del contacto" className="px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm" />
          <input name="contactoEmail" placeholder="Email del contacto" className="px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm" />
          <input name="contactoTelefono" placeholder="Teléfono del contacto" className="px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm" />
        </div>
        <button
          type="submit"
          className="w-full px-5 py-2.5 bg-[#9568ef] hover:bg-[#7c4fdb] text-white rounded-xl text-sm font-medium transition-colors"
        >
          Agregar caso
        </button>
      </form>
    </div>
  )
}
