import { prisma } from "@/lib/prisma"

const MS_HOUR = 60 * 60 * 1000
const MS_DAY = 24 * MS_HOUR

export interface SecurityStats {
  failed24h: number
  failed7d: number
  successes24h: number
  rateLimit24h: number
  exports30d: number
  totalAudit: number
  topFailedIps: Array<{ ipMasked: string; count: number }>
  topFailedAccounts: Array<{ accountHash: string; count: number }>
  bruteForceAlerts: Array<{ ipMasked: string; count: number; lastAt: Date }>
  recentEvents: Array<{
    id: number
    action: string
    actorRef: string | null
    targetRef: string | null
    ipMasked: string | null
    detail: string | null
    createdAt: Date
  }>
}

function maskIp(ip: string | null): string {
  if (!ip) return "inconnue"
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) return `${v4[1]}.${v4[2]}.x.x`
  if (ip.includes(":")) {
    const parts = ip.split(":")
    return parts.slice(0, 2).join(":") + ":xxxx::"
  }
  return ip.slice(0, 4) + "…"
}

function hashAccount(email: string): string {
  // Pseudonyme stable mais non réversible côté UI (FNV-1a 32 bits)
  let h = 2166136261
  for (let i = 0; i < email.length; i++) {
    h ^= email.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return "acct-" + ((h >>> 0).toString(16).padStart(8, "0"))
}

export async function getSecurityStats(): Promise<SecurityStats> {
  const since24h = new Date(Date.now() - MS_DAY)
  const since7d = new Date(Date.now() - 7 * MS_DAY)
  const since30d = new Date(Date.now() - 30 * MS_DAY)
  const since1h = new Date(Date.now() - MS_HOUR)

  const [failed24h, failed7d, successes24h, rateLimit24h, exports30d, totalAudit, recentEvents, failedRecent7d] =
    await Promise.all([
      prisma.auditLog.count({ where: { action: "LOGIN_FAILED", createdAt: { gte: since24h } } }),
      prisma.auditLog.count({ where: { action: "LOGIN_FAILED", createdAt: { gte: since7d } } }),
      prisma.auditLog.count({ where: { action: "LOGIN_SUCCESS", createdAt: { gte: since24h } } }),
      prisma.auditLog.count({ where: { action: "RATE_LIMIT_HIT", createdAt: { gte: since24h } } }),
      prisma.auditLog.count({ where: { action: "EXPORT_USER_DATA", createdAt: { gte: since30d } } }),
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        where: { action: { in: ["LOGIN_FAILED", "LOGIN_SUCCESS", "RATE_LIMIT_HIT", "EXPORT_USER_DATA"] } },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.auditLog.findMany({
        where: { action: "LOGIN_FAILED", createdAt: { gte: since7d } },
        select: { ip: true, metadata: true, createdAt: true },
      }),
    ])

  const ipCounts = new Map<string | null, { count: number; lastAt: Date }>()
  const emailCounts = new Map<string, number>()

  for (const evt of failedRecent7d) {
    const cur = ipCounts.get(evt.ip) || { count: 0, lastAt: evt.createdAt }
    cur.count += 1
    if (evt.createdAt > cur.lastAt) cur.lastAt = evt.createdAt
    ipCounts.set(evt.ip, cur)

    if (evt.metadata) {
      try {
        const m = JSON.parse(evt.metadata)
        if (typeof m?.email === "string") {
          emailCounts.set(m.email, (emailCounts.get(m.email) || 0) + 1)
        }
      } catch {}
    }
  }

  const topFailedIps = Array.from(ipCounts.entries())
    .map(([ip, v]) => ({ ipMasked: maskIp(ip), count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const topFailedAccounts = Array.from(emailCounts.entries())
    .map(([email, count]) => ({ accountHash: hashAccount(email), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Brute-force : >= 5 échecs sur la même IP en 1h
  const bruteForceCandidates = await prisma.auditLog.findMany({
    where: { action: "LOGIN_FAILED", createdAt: { gte: since1h } },
    select: { ip: true, createdAt: true },
  })
  const bfMap = new Map<string | null, { count: number; lastAt: Date }>()
  for (const evt of bruteForceCandidates) {
    const cur = bfMap.get(evt.ip) || { count: 0, lastAt: evt.createdAt }
    cur.count += 1
    if (evt.createdAt > cur.lastAt) cur.lastAt = evt.createdAt
    bfMap.set(evt.ip, cur)
  }
  const bruteForceAlerts = Array.from(bfMap.entries())
    .filter(([, v]) => v.count >= 5)
    .map(([ip, v]) => ({ ipMasked: maskIp(ip), count: v.count, lastAt: v.lastAt }))
    .sort((a, b) => b.count - a.count)

  const sanitizedEvents = recentEvents.map((e) => {
    let detail: string | null = null
    if (e.metadata) {
      try {
        const m = JSON.parse(e.metadata)
        // Ne JAMAIS exposer email/score/données utilisateur ici
        const safeKeys = ["reason", "route"]
        const safe: Record<string, unknown> = {}
        for (const k of safeKeys) if (k in m) safe[k] = m[k]
        detail = Object.entries(safe).map(([k, v]) => `${k}: ${v}`).join(" — ") || null
      } catch {
        detail = null
      }
    }
    return {
      id: e.id,
      action: e.action,
      actorRef: e.actorId ? `#${e.actorId}` : null,
      targetRef: e.targetId ? `#${e.targetId}` : null,
      ipMasked: e.ip ? maskIp(e.ip) : null,
      detail,
      createdAt: e.createdAt,
    }
  })

  return {
    failed24h,
    failed7d,
    successes24h,
    rateLimit24h,
    exports30d,
    totalAudit,
    topFailedIps,
    topFailedAccounts,
    bruteForceAlerts,
    recentEvents: sanitizedEvents,
  }
}
