import { auth } from "@/lib/auth"
import { signOut } from "@/lib/auth"
import Link from "next/link"

export async function Navbar() {
  const session = await auth()

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-[#e8e8ed] sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-[#1d1d1f] tracking-tight text-lg">
          DINAMITA
          <span className="text-[#9568ef] ml-1.5 text-sm font-normal">cotizador</span>
        </Link>

        {session?.user && (
          <div className="flex items-center gap-4">
            <Link href="/settings" className="text-[#9568ef] hover:text-[#7c4fdb] text-sm transition-colors">
              Configuración
            </Link>
            <span className="text-[#86868b] text-sm">{session.user.name || session.user.email}</span>
            <form
              action={async () => {
                "use server"
                await signOut()
              }}
            >
              <button
                type="submit"
                className="text-sm text-[#86868b] hover:text-[#1d1d1f] transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  )
}
