"use client"

import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useState, Suspense } from "react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const form = new FormData(e.currentTarget)
      const result = await signIn("credentials", {
        email: form.get("email") as string,
        password: form.get("password") as string,
        redirect: false,
      })

      if (result?.error) {
        setError("Credenciales inválidas")
      } else if (result?.ok) {
        router.push(callbackUrl)
        return
      }
    } catch (err) {
      setError("Error de conexión con el servidor")
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm mx-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight">DINAMITA</h1>
        <p className="text-zinc-400 mt-2 text-sm">Cotizador</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#9568ef] focus:ring-1 focus:ring-[#9568ef]/30 transition-all"
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          required
          className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#9568ef] focus:ring-1 focus:ring-[#9568ef]/30 transition-all"
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#9568ef] hover:bg-[#7c4fdb] disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="text-zinc-600 text-xs text-center mt-6">
        Demo: efrain@disruptiva.pe / admin123
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-zinc-500 text-center py-16">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
