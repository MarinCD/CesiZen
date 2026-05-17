import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTrackerEmotions } from "@/lib/services/trackerService"
import { TrackerClient } from "@/components/tracker/TrackerClient"

export default async function TrackerPage() {
  const session = await getServerSession(authOptions)
  const userId = parseInt((session!.user as any).id)
  const emotions = await getTrackerEmotions(userId, 30)

  const serialized = emotions.map((e) => ({
    ...e,
    date: e.date.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tracker d'émotions</h1>
        <p className="text-muted-foreground mt-1">
          Notez vos émotions quotidiennes et visualisez votre évolution.
        </p>
      </div>
      <TrackerClient initialEmotions={serialized} />
    </div>
  )
}
