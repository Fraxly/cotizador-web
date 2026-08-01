import { Navbar } from "@/components/Navbar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
