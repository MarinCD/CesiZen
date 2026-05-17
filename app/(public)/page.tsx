import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Wind, Brain, TrendingUp, ArrowRight } from "lucide-react"

export default function HomePage() {
  const features = [
    {
      icon: Brain,
      title: "Diagnostic de stress",
      description:
        "Évaluez votre niveau de stress grâce à l'échelle de Holmes & Rahe, validée scientifiquement.",
      href: "/diagnostic",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: Wind,
      title: "Exercices de respiration",
      description:
        "Pratiquez la cohérence cardiaque, le box breathing et la respiration 4-7-8 pour vous détendre.",
      href: "/exercices",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      icon: Heart,
      title: "Tracker d'émotions",
      description:
        "Suivez l'évolution de vos émotions au quotidien et visualisez vos tendances sur 7 ou 30 jours.",
      href: "/tracker",
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      icon: TrendingUp,
      title: "Ressources bien-être",
      description:
        "Accédez à des articles de qualité sur la santé mentale, le stress, la méditation et le sommeil.",
      href: "/informations",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-green-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Heart className="h-4 w-4" aria-hidden="true" />
            Plateforme de santé mentale
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Prenez soin de votre <span className="text-primary">bien-être mental</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            CESIZen vous accompagne dans la gestion du stress et l'amélioration de votre qualité
            de vie grâce à des outils scientifiquement validés.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/diagnostic">
                Faire mon diagnostic
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/register">Créer un compte gratuit</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Des outils concrets et accessibles pour mieux comprendre et gérer votre stress au quotidien.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-lg ${feature.bg} mb-4`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    <Link
                      href={feature.href}
                      className={`text-sm font-medium ${feature.color} hover:underline inline-flex items-center gap-1`}
                    >
                      En savoir plus
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Commencez dès aujourd'hui</h2>
          <p className="mb-8 opacity-90">
            Créez votre compte gratuitement et accédez à tous les outils de CESIZen. Vos données
            sont hébergées en France et protégées conformément au RGPD.
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/register">Créer mon compte gratuit</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
