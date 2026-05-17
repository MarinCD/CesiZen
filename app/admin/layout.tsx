import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import Link from "next/link"
import { LayoutDashboard, Users, FileText, ClipboardList, Shield } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMINISTRATEUR") {
    redirect("/login")
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
    { href: "/admin/informations", label: "Articles", icon: FileText },
    { href: "/admin/questionnaires", label: "Questionnaires", icon: ClipboardList },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="bg-blue-700 text-white px-4 py-2 text-sm flex items-center gap-2">
        <Shield className="h-4 w-4" aria-hidden="true" />
        <span>Mode Administration</span>
      </div>
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-8 gap-8">
        <aside className="hidden md:block w-52 flex-shrink-0" aria-label="Navigation administration">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Footer />
    </div>
  )
}
