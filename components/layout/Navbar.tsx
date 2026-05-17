"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Heart } from "lucide-react"

export function Navbar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = session?.user as any

  const navLinks = [
    { href: "/informations", label: "Informations" },
    { href: "/diagnostic", label: "Diagnostic" },
    { href: "/exercices", label: "Exercices" },
  ]

  const userLinks = session
    ? [
        { href: "/historique", label: "Mon historique" },
        { href: "/tracker", label: "Tracker" },
        { href: "/profil", label: "Profil" },
      ]
    : []

  return (
    <nav className="bg-white border-b border-border shadow-sm" role="navigation" aria-label="Navigation principale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Heart className="h-6 w-6" aria-hidden="true" />
            CESIZen
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {userLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user?.role === "ADMINISTRATEUR" && (
              <Link
                href="/admin/dashboard"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Auth buttons desktop */}
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user?.name || user?.email}
                </span>
                <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Créer un compte</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-md"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {userLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user?.role === "ADMINISTRATEUR" && (
            <Link
              href="/admin/dashboard"
              className="block text-sm font-medium text-blue-600 py-1"
              onClick={() => setMobileOpen(false)}
            >
              Administration
            </Link>
          )}
          <div className="pt-2 border-t space-y-2">
            {session ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Déconnexion
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>Connexion</Link>
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>Créer un compte</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
