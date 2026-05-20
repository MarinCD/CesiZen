#!/usr/bin/env node
/**
 * Purge RGPD — à exécuter périodiquement (cron mensuel recommandé).
 *
 * Politique de conservation :
 *   - Résultats de diagnostic    : 24 mois
 *   - Journaux d'audit           : 12 mois
 *   - Comptes utilisateurs       : 3 ans d'inactivité (suppression définitive)
 *
 * Usage :
 *   node scripts/purge-data.cjs            # mode dry-run
 *   node scripts/purge-data.cjs --apply    # exécute la suppression
 */
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()
const APPLY = process.argv.includes("--apply")

const MS_DAY = 24 * 60 * 60 * 1000
const cutoff = (days) => new Date(Date.now() - days * MS_DAY)

async function main() {
  const cutoffDiagnostics = cutoff(30 * 24) // 24 mois
  const cutoffAudit = cutoff(30 * 12) // 12 mois
  const cutoffInactiveUsers = cutoff(365 * 3) // 3 ans

  const diagToDelete = await prisma.resultatDiagnostic.count({
    where: { dateRealisation: { lt: cutoffDiagnostics } },
  })
  const auditToDelete = await prisma.auditLog.count({
    where: { createdAt: { lt: cutoffAudit } },
  })
  const inactiveUsers = await prisma.utilisateur.findMany({
    where: {
      role: "UTILISATEUR",
      dateCreation: { lt: cutoffInactiveUsers },
      resultatsDiagnostic: { none: { dateRealisation: { gte: cutoffInactiveUsers } } },
    },
    select: { id: true, email: true },
  })

  console.log("=== Purge RGPD ===")
  console.log(`Résultats diagnostic > 24 mois : ${diagToDelete}`)
  console.log(`Journaux audit > 12 mois       : ${auditToDelete}`)
  console.log(`Comptes inactifs > 3 ans       : ${inactiveUsers.length}`)

  if (!APPLY) {
    console.log("\n(mode dry-run, ajoutez --apply pour exécuter)")
    return
  }

  const r1 = await prisma.resultatDiagnostic.deleteMany({
    where: { dateRealisation: { lt: cutoffDiagnostics } },
  })
  const r2 = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoffAudit } },
  })
  const r3 = await prisma.utilisateur.deleteMany({
    where: { id: { in: inactiveUsers.map((u) => u.id) } },
  })

  console.log(`\nSupprimés : ${r1.count} résultats, ${r2.count} audits, ${r3.count} comptes.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
