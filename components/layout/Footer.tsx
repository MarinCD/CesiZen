import Link from "next/link"
import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-primary mb-2">
              <Heart className="h-5 w-5" aria-hidden="true" />
              CESIZen
            </div>
            <p className="text-sm text-muted-foreground">
              Plateforme de santé mentale et de bien-être, développée en partenariat avec le
              Ministère de la Santé et de la Prévention.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/informations" className="hover:text-foreground">Informations</Link></li>
              <li><Link href="/diagnostic" className="hover:text-foreground">Diagnostic stress</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Légal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/confidentialite" className="hover:text-foreground">Politique de confidentialité</Link></li>
              <li><Link href="/mentions-legales" className="hover:text-foreground">Mentions légales</Link></li>
              <li><Link href="/cgu" className="hover:text-foreground">CGU</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} CESIZen — Hébergé en France par AlwaysData
          </p>
          <p className="mt-1">
            Les informations de ce site ne remplacent pas un avis médical professionnel.
          </p>
        </div>
      </div>
    </footer>
  )
}
