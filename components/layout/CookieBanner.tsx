"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"

const STORAGE_KEY = "cesizen-cookie-notice"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ status: "dismissed", date: new Date().toISOString() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 bg-background border rounded-lg shadow-lg p-5"
    >
      <div className="flex items-start gap-3">
        <Cookie className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 space-y-3">
          <h2 id="cookie-banner-title" className="font-semibold text-sm">Information sur les cookies</h2>
          <p id="cookie-banner-desc" className="text-xs text-muted-foreground leading-relaxed">
            CESIZen utilise uniquement un cookie de session nécessaire à l'authentification et le
            stockage local pour vos préférences d'accessibilité. Aucun traceur publicitaire ou de
            mesure d'audience n'est utilisé.{" "}
            <Link href="/confidentialite" className="underline hover:text-foreground">
              En savoir plus
            </Link>.
          </p>
          <Button size="sm" onClick={dismiss}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}
