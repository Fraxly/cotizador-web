"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={`text-sm transition-colors px-3 py-1.5 rounded-full ${
        active
          ? "bg-[#9568ef]/10 text-[#9568ef] font-medium"
          : "text-[#86868b] hover:text-[#1d1d1f]"
      }`}
    >
      {children}
    </Link>
  )
}

export function NavLinks() {
  const pathname = usePathname()
  const inCalificaciones = pathname.startsWith("/calificaciones")
  const inSettings = pathname.startsWith("/settings")
  const inCotizador = !inCalificaciones && !inSettings

  return (
    <div className="flex items-center gap-1">
      <NavLink href="/" active={inCotizador}>Cotizaciones</NavLink>
      <NavLink href="/calificaciones" active={inCalificaciones}>Calificaciones</NavLink>
      <NavLink href="/settings" active={inSettings}>Configuración</NavLink>
    </div>
  )
}
