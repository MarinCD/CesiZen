import type { Metadata } from "next"
import Script from "next/script"
import { headers } from "next/headers"
import { connection } from "next/server"
import "./globals.css"
import { Providers } from "./providers"
import { CookieBanner } from "@/components/layout/CookieBanner"
import { AccessibilityPanel } from "@/components/layout/AccessibilityPanel"

export const metadata: Metadata = {
  title: "CESIZen — Santé mentale & bien-être",
  description:
    "Plateforme de santé mentale : auto-diagnostic de stress basé sur l'échelle de Holmes & Rahe et ressources bien-être.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Une CSP à nonce exige un rendu par requête afin que Next.js puisse appliquer
  // un nonce neuf à chaque script d'hydratation.
  await connection()
  const nonce = (await headers()).get("x-nonce") ?? undefined

  return (
    // a11y-init applique les préférences enregistrées avant l'hydratation pour
    // éviter un flash visuel. Cette mutation ciblée de <html> est intentionnelle.
    <html lang="fr" suppressHydrationWarning>
      <head>
        <Script src="/a11y-init.js" strategy="beforeInteractive" nonce={nonce} />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <Providers>
          {children}
          <CookieBanner />
          <AccessibilityPanel />
        </Providers>
      </body>
    </html>
  )
}
