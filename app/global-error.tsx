"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="fr">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
          <p className="max-w-lg text-slate-600">
            Le problème a été signalé. Vous pouvez essayer de relancer cette page.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  )
}
