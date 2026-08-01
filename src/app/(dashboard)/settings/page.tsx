import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { llmApiKey: true, llmModel: true, llmBaseUrl: true },
  })

  async function saveSettings(formData: FormData) {
    "use server"
    const sess = await auth()
    if (!sess?.user?.id) return

    const llmApiKey = (formData.get("llmApiKey") as string) || null
    const llmModel = (formData.get("llmModel") as string) || null
    const llmBaseUrl = (formData.get("llmBaseUrl") as string) || null

    await prisma.user.update({
      where: { id: sess.user.id },
      data: { llmApiKey, llmModel, llmBaseUrl },
    })

    revalidatePath("/settings")
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-[#1d1d1f] mb-1">Configuración</h1>
      <p className="text-[#86868b] text-sm mb-10">Configura el modelo de IA que usa el cotizador</p>

      <form action={saveSettings} className="bg-white border border-[#e8e8ed] rounded-2xl p-6 space-y-6">
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
            Modelo
          </label>
          <input
            id="model"
            name="llmModel"
            className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#9568ef]/30 focus:border-[#9568ef] transition-all"
            defaultValue={user?.llmModel || "deepseek/deepseek-v4-pro"}
          />
          <p className="text-xs text-[#86868b] mt-1.5">Ej: <code className="bg-[#f5f5f7] px-1 rounded">deepseek/deepseek-v4-pro</code> o <code className="bg-[#f5f5f7] px-1 rounded">openai/gpt-4o</code></p>
        </div>

        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
            API Key
          </label>
          <input
            id="apiKey"
            name="llmApiKey"
            type="password"
            className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#9568ef]/30 focus:border-[#9568ef] transition-all"
            defaultValue={user?.llmApiKey || ""}
            placeholder="sk-..."
          />
          <p className="text-xs text-[#86868b] mt-1.5">La key se guarda en la base de datos. Déjala vacía para usar la del .env.</p>
        </div>

        <div>
          <label htmlFor="baseUrl" className="block text-sm font-medium text-[#1d1d1f] mb-1.5">
            Base URL
          </label>
          <input
            id="baseUrl"
            name="llmBaseUrl"
            className="w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#9568ef]/30 focus:border-[#9568ef] transition-all"
            defaultValue={user?.llmBaseUrl || "https://openrouter.ai/api/v1"}
            placeholder="https://openrouter.ai/api/v1"
          />
          <p className="text-xs text-[#86868b] mt-1.5">Endpoint compatible con OpenAI. Déjala vacía para usar OpenRouter.</p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full px-5 py-2.5 bg-[#9568ef] hover:bg-[#7c4fdb] text-white rounded-xl text-sm font-medium transition-colors"
          >
            Guardar configuración
          </button>
        </div>
      </form>

      <div className="mt-8 bg-[#fef6e0] border border-[#ffe177] rounded-2xl p-4">
        <p className="text-sm text-[#1d1d1f] font-medium mb-1">Usando modelo del servidor</p>
        <p className="text-xs text-[#86868b]">
          Si dejas la API Key vacía, el cotizador usará el modelo configurado en el servidor (.env).
          Los cambios aplican inmediatamente en el chat.
        </p>
      </div>
    </div>
  )
}
