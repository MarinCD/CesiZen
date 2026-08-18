import type { ReactNode } from "react"

interface LegalPageProps {
  title: string
  description: string
  updatedAt: string
  children: ReactNode
}

export function LegalPage({ title, description, updatedAt, children }: LegalPageProps) {
  return (
    <div className="bg-muted/30 py-10 sm:py-14">
      <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Informations légales
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Mis à jour le {updatedAt}</p>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
        </header>

        <div className="legal-content mt-6">{children}</div>
      </article>
    </div>
  )
}
