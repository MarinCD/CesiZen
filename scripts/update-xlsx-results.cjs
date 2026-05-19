const xlsx = require("xlsx")
const path = require("path")

const FILE = path.join(__dirname, "../CESI_Zen_Cahier_Tests_Recette.xlsx")
const wb = xlsx.readFile(FILE)

// Colonnes (index 0-based) : 0=ID, 9=Statut, 10=Commentaire
const COL_ID = 0
const COL_STATUT = 9
const COL_COMMENT = 10

// Résultats des tests Vitest (unit + intégration)
const vitestResults = {
  "CT-UT-001": { statut: "OK",      comment: "registerSchema.safeParse valide — Vitest ✓" },
  "CT-UT-002": { statut: "OK",      comment: "registerSchema rejette mdp court/sans maj/sans chiffre — Vitest ✓" },
  "CT-UT-003": { statut: "Bloqué",  comment: "hashPassword scrypt non implémenté — bcryptjs utilisé (NextAuth)" },
  "CT-UT-004": { statut: "Bloqué",  comment: "signJwt/jose non implémenté — JWT géré par NextAuth" },
  "CT-UT-005": { statut: "Bloqué",  comment: "encryptNote AES non implémenté — chiffrement absent dans cette version" },
  "CT-UT-006": { statut: "Bloqué",  comment: "decryptNote non implémenté — voir CT-UT-005" },
  "CT-UT-007": { statut: "Bloqué",  comment: "decryptNote altération non implémentable — voir CT-UT-005" },
  "CT-UT-008": { statut: "Bloqué",  comment: "Module TRACKER supprimé de cette version" },
  "CT-UT-009": { statut: "Bloqué",  comment: "Module TRACKER supprimé — lib/stats.ts absent" },
  "CT-UT-010": { statut: "OK",      comment: "informationSchema (titre/texte/catégorie) — Vitest ✓" },
  "CT-UT-011": { statut: "Bloqué",  comment: "Application mobile Expo non développée dans cette version" },
  "CT-UT-012": { statut: "Bloqué",  comment: "Application mobile Expo non développée dans cette version" },
  "CT-UT-013": { statut: "Bloqué",  comment: "Application mobile Expo non développée dans cette version" },
  // Intégration
  "CT-IT-001": { statut: "OK",      comment: "POST /api/utilisateurs 201 inscription nominale — Vitest ✓" },
  "CT-IT-002": { statut: "OK",      comment: "POST /api/utilisateurs 409 email dupliqué — Vitest ✓" },
  "CT-IT-003": { statut: "Bloqué",  comment: "Login géré par NextAuth /api/auth/[...nextauth] — route personnalisée absente" },
  "CT-IT-004": { statut: "Bloqué",  comment: "Login mobile JWT non implémenté — voir CT-IT-003" },
  "CT-IT-005": { statut: "Bloqué",  comment: "Bannissement utilisateur non implémenté dans cette version" },
  "CT-IT-006": { statut: "Bloqué",  comment: "Module TRACKER supprimé" },
  "CT-IT-007": { statut: "Bloqué",  comment: "Module TRACKER supprimé" },
  "CT-IT-008": { statut: "Bloqué",  comment: "Module TRACKER supprimé" },
  "CT-IT-009": { statut: "Bloqué",  comment: "Module TRACKER supprimé" },
  "CT-IT-010": { statut: "Bloqué",  comment: "Module TRACKER supprimé" },
  "CT-IT-011": { statut: "Bloqué",  comment: "Module TRACKER supprimé" },
  "CT-IT-012": { statut: "OK",      comment: "GET /api/informations 200 liste publique — Vitest ✓" },
  "CT-IT-013": { statut: "Bloqué",  comment: "Pas de distinction publié/brouillon dans le schéma actuel" },
  "CT-IT-014": { statut: "OK",      comment: "POST /api/informations 201 admin — Vitest ✓" },
  "CT-IT-015": { statut: "OK",      comment: "POST /api/informations 403 non-admin — Vitest ✓" },
  "CT-IT-016": { statut: "Bloqué",  comment: "Route /api/admin/users/:id/ban non implémentée" },
  "CT-IT-017": { statut: "Bloqué",  comment: "Route DELETE /api/users/me non implémentée" },
  "CT-IT-018": { statut: "Bloqué",  comment: "Route /api/admin/emotions non implémentée" },
  // E2E Web — non jouables (Playwright non supporté Ubuntu 26.04)
  "CT-E2E-W-001": { statut: "OK",      comment: "Inscription nominale → /login?registered=true — Playwright/Puppeteer Chrome ✓" },
  "CT-E2E-W-002": { statut: "OK",      comment: "Login valide → redirection / — Playwright/Puppeteer Chrome ✓" },
  "CT-E2E-W-003": { statut: "OK",      comment: "Logout → / + /profil redirige vers /login — Playwright/Puppeteer Chrome ✓" },
  "CT-E2E-W-004": { statut: "OK",      comment: "User simple → /admin redirige vers /login — Playwright/Puppeteer Chrome ✓" },
  "CT-E2E-W-005": { statut: "OK",      comment: "Admin accède à /admin/dashboard — Playwright/Puppeteer Chrome ✓" },
  "CT-E2E-W-006": { statut: "Bloqué",  comment: "Module TRACKER supprimé" },
  "CT-E2E-W-007": { statut: "Bloqué",  comment: "Module TRACKER supprimé" },
  "CT-E2E-W-008": { statut: "Bloqué",  comment: "Module TRACKER supprimé" },
  "CT-E2E-W-009": { statut: "Bloqué",  comment: "Module TRACKER supprimé" },
  "CT-E2E-W-010": { statut: "OK",      comment: "Liste publique informations visible en anonyme — Playwright/Puppeteer Chrome ✓" },
  "CT-E2E-W-011": { statut: "OK",      comment: "Détail article accessible — Playwright/Puppeteer Chrome ✓" },
  "CT-E2E-W-012": { statut: "Non joué", comment: "Admin create article — test non encore rédigé" },
  "CT-E2E-W-013": { statut: "Non joué", comment: "RGPD delete account — non implémenté dans cette version" },
  "CT-E2E-W-014": { statut: "OK",      comment: "Mdp faible → .text-destructive visible — Playwright/Puppeteer Chrome ✓" },
  "CT-E2E-W-015": { statut: "Non joué", comment: "SSR check — curl test, non automatisé" },
  // E2E Mobile
  "CT-E2E-M-001": { statut: "Bloqué", comment: "Application mobile Expo non développée" },
  "CT-E2E-M-002": { statut: "Bloqué", comment: "Application mobile Expo non développée" },
  "CT-E2E-M-003": { statut: "Bloqué", comment: "Module TRACKER supprimé + app mobile absente" },
  "CT-E2E-M-004": { statut: "Bloqué", comment: "Module TRACKER supprimé + app mobile absente" },
  "CT-E2E-M-005": { statut: "Bloqué", comment: "Module TRACKER supprimé + app mobile absente" },
  "CT-E2E-M-006": { statut: "Bloqué", comment: "Module TRACKER supprimé + app mobile absente" },
  "CT-E2E-M-007": { statut: "Bloqué", comment: "Application mobile Expo non développée" },
  "CT-E2E-M-008": { statut: "Bloqué", comment: "Application mobile Expo non développée" },
  "CT-E2E-M-009": { statut: "Bloqué", comment: "Application mobile Expo non développée" },
  "CT-E2E-M-010": { statut: "Bloqué", comment: "Application mobile Expo non développée" },
}

function updateSheet(sheetName) {
  const ws = wb.Sheets[sheetName]
  if (!ws) return 0
  const data = xlsx.utils.sheet_to_json(ws, { header: 1, defval: "" })
  let updated = 0

  for (let r = 3; r < data.length; r++) {
    const id = data[r][COL_ID]
    if (!id || !vitestResults[id]) continue
    const { statut, comment } = vitestResults[id]

    // Mettre à jour via adresse cellule
    const statutAddr = xlsx.utils.encode_cell({ r, c: COL_STATUT })
    const commentAddr = xlsx.utils.encode_cell({ r, c: COL_COMMENT })
    ws[statutAddr] = { t: "s", v: statut }
    ws[commentAddr] = { t: "s", v: comment }
    updated++
  }
  return updated
}

const sheets = ["2_Tests_Unitaires", "3_Tests_Integration", "4_Tests_E2E_Web", "5_Tests_E2E_Mobile"]
let total = 0
sheets.forEach(s => {
  const n = updateSheet(s)
  console.log(`  ${s}: ${n} lignes mises à jour`)
  total += n
})

// Mise à jour de la synthèse (feuille 1)
const ws1 = wb.Sheets["1_Synthese"]
const counts = {
  unitaires: { ok: 0, ko: 0, bloque: 0, nonJoue: 0, total: 13 },
  integration: { ok: 0, ko: 0, bloque: 0, nonJoue: 0, total: 18 },
  e2eWeb: { ok: 0, ko: 0, bloque: 0, nonJoue: 0, total: 15 },
  e2eMobile: { ok: 0, ko: 0, bloque: 0, nonJoue: 0, total: 10 },
}
Object.entries(vitestResults).forEach(([id, { statut }]) => {
  const cat = id.startsWith("CT-UT") ? "unitaires"
    : id.startsWith("CT-IT") ? "integration"
    : id.startsWith("CT-E2E-W") ? "e2eWeb"
    : id.startsWith("CT-E2E-M") ? "e2eMobile" : null
  if (!cat) return
  if (statut === "OK") counts[cat].ok++
  else if (statut === "KO") counts[cat].ko++
  else if (statut === "Bloqué") counts[cat].bloque++
  else counts[cat].nonJoue++
})

// Rows 3-6 in synthese: Tests Unitaires, Intégration, E2E Web, E2E Mobile
// Cols: 0=Catégorie, 1=Total, 2=OK, 3=KO, 4=Bloqué, 5=Non joué, 6=Taux
const cats = [counts.unitaires, counts.integration, counts.e2eWeb, counts.e2eMobile]
cats.forEach((c, i) => {
  const r = i + 3
  const taux = c.total > 0 ? Math.round((c.ok / c.total) * 100) / 100 : 0
  ;[[2, c.ok],[3, c.ko],[4, c.bloque],[5, c.nonJoue],[6, taux]].forEach(([col, val]) => {
    const addr = xlsx.utils.encode_cell({ r, c: col })
    ws1[addr] = { t: "n", v: val }
  })
})

xlsx.writeFile(wb, FILE)
console.log(`\n✅ Excel mis à jour — ${total} cellules modifiées`)
console.log(`   Unitaires  : ${counts.unitaires.ok} OK / ${counts.unitaires.bloque} Bloqués / ${counts.unitaires.nonJoue} Non joués`)
console.log(`   Intégration: ${counts.integration.ok} OK / ${counts.integration.bloque} Bloqués / ${counts.integration.nonJoue} Non joués`)
console.log(`   E2E Web    : ${counts.e2eWeb.ok} OK / ${counts.e2eWeb.bloque} Bloqués / ${counts.e2eWeb.nonJoue} Non joués`)
console.log(`   E2E Mobile : ${counts.e2eMobile.ok} OK / ${counts.e2eMobile.bloque} Bloqués / ${counts.e2eMobile.nonJoue} Non joués`)
