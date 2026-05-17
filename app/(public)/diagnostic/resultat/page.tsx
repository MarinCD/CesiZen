import { ResultatCard } from "@/components/diagnostic/ResultatCard"
import { redirect } from "next/navigation"

interface Props {
  searchParams: { score?: string; interpretation?: string; saved?: string }
}

export default function ResultatPage({ searchParams }: Props) {
  const score = parseInt(searchParams.score || "0")
  const interpretation = searchParams.interpretation || "FAIBLE"
  const saved = searchParams.saved === "true"

  if (!searchParams.score) redirect("/diagnostic")

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Votre résultat</h1>
        <p className="text-muted-foreground">
          Basé sur l'échelle de Holmes & Rahe (1967)
        </p>
      </div>
      <ResultatCard score={score} interpretation={interpretation} saved={saved} />
    </div>
  )
}
