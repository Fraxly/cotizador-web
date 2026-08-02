import { Suspense } from "react"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="flex">
        <Suspense>
          <Sidebar />
        </Suspense>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
