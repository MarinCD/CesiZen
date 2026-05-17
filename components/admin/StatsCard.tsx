import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface Props {
  title: string
  value: number
  icon: LucideIcon
  color: string
  bg: string
}

export function StatsCard({ title, value, icon: Icon, color, bg }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${bg}`}>
            <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value.toLocaleString("fr-FR")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
