import { prisma } from "@/lib/prisma"
import { createHmac } from "crypto"

export interface AuditEntry {
  action: string
  actorId?: number | null
  targetId?: number | null
  ip?: string | null
  metadata?: Record<string, unknown>
}

function pseudonymize(value: string, domain: "ip" | "account") {
  const secret = process.env.AUDIT_HMAC_KEY || process.env.NEXTAUTH_SECRET
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUDIT_HMAC_KEY ou NEXTAUTH_SECRET doit être configuré")
  }
  const digest = createHmac("sha256", secret || "cesizen-test-only")
    .update(`${domain}:${value.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 16)
  return `${domain === "ip" ? "ip" : "acct"}-${digest}`
}

function sanitizeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return null
  const sanitized = { ...metadata }

  if (typeof sanitized.email === "string") {
    sanitized.accountRef = pseudonymize(sanitized.email, "account")
    delete sanitized.email
  }

  // Le score est une donnée de santé et n'a pas sa place dans un journal technique.
  delete sanitized.score
  return Object.keys(sanitized).length > 0 ? JSON.stringify(sanitized) : null
}

export async function logAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actorId ?? null,
        targetId: entry.targetId ?? null,
        ip: entry.ip ? pseudonymize(entry.ip.split(",")[0], "ip") : null,
        metadata: sanitizeMetadata(entry.metadata),
      },
    })
  } catch (err) {
    console.error("[audit] failed to log entry", entry.action, err)
  }
}
