import { ResultatCard } from "@/components/diagnostic/ResultatCard"
import { redirect } from "next/navigation"

interface Props {
  searchParams: Promise<{ score?: string; interpretation?: string; saved?: string }>
}

export default async function ResultatPage({ searchParams }: Props) {
  const query = await searchParams
  const score = parseInt(query.score || "0")
  const interpretation = query.interpretation || "FAIBLE"
  const saved = query.saved === "true"

  if (!query.score) redirect("/diagnostic")

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
