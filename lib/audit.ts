import { prisma } from "@/lib/prisma"

export interface AuditEntry {
  action: string
  actorId?: number | null
  targetId?: number | null
  ip?: string | null
  metadata?: Record<string, unknown>
}

export async function logAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actorId ?? null,
        targetId: entry.targetId ?? null,
        ip: entry.ip ?? null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    })
  } catch (err) {
    console.error("[audit] failed to log entry", entry.action, err)
  }
}
