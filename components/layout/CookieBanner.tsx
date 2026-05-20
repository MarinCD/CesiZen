"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"

const STORAGE_KEY = "cesizen-cookie-consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ status: "accepted", date: new Date().toISOString() }))
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
          <h2 id="cookie-banner-title" className="font-semibold text-sm">Cookies</h2>
          <p id="cookie-banner-desc" className="text-xs text-muted-foreground leading-relaxed">
            Ce site utilise uniquement des cookies strictement nécessaires à son fonctionnement
            (session d'authentification). Aucun traceur publicitaire ou de mesure d'audience tierce
            n'est déposé.{" "}
            <Link href="/confidentialite" className="underline hover:text-foreground">
              En savoir plus
            </Link>.
          </p>
          <Button size="sm" onClick={accept}>
            J'ai compris
          </Button>
        </div>
      </div>
    </div>
  )
}
