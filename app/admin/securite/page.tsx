import { getSecurityStats } from "@/lib/services/securityService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShieldAlert,
  ShieldCheck,
  LogIn,
  XCircle,
  Activity,
  AlertTriangle,
  Download,
} from "lucide-react"

const ACTION_LABELS: Record<string, { label: string; tone: "success" | "warn" | "danger" | "info" }> = {
  LOGIN_SUCCESS: { label: "Connexion réussie", tone: "success" },
  LOGIN_FAILED: { label: "Échec de connexion", tone: "danger" },
  RATE_LIMIT_HIT: { label: "Rate-limit déclenché", tone: "warn" },
  EXPORT_USER_DATA: { label: "Export RGPD", tone: "info" },
}

const toneClass = (tone: string) =>
  tone === "success" ? "bg-green-100 text-green-700"
    : tone === "danger" ? "bg-red-100 text-red-700"
    : tone === "warn" ? "bg-amber-100 text-amber-700"
    : "bg-blue-100 text-blue-700"

function StatCard({
  title, value, icon: Icon, sub, tone = "default",
}: {
  title: string
  value: number | string
  icon: any
  sub?: string
  tone?: "default" | "success" | "danger" | "warn"
}) {
  const toneBg =
    tone === "danger" ? "bg-red-50 border-red-200"
    : tone === "warn" ? "bg-amber-50 border-amber-200"
    : tone === "success" ? "bg-green-50 border-green-200"
    : ""
  return (
    <Card className={toneBg}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  )
}

export default async function SecuritePage() {
  const stats = await getSecurityStats()

  const underAttack = stats.bruteForceAlerts.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cybersécurité</h1>
        <p className="text-muted-foreground mt-1">
          Surveillance des événements de sécurité, tentatives d'intrusion et accès aux données sensibles.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          ⓘ Les adresses IP sont partiellement masquées et les comptes ciblés affichés sous forme de
          pseudonymes irréversibles (principe de minimisation RGPD). Pour investiguer un incident
          précis, accédez au journal d'audit brut côté base de données.
        </p>
      </div>

      {/* État global */}
      <Card className={underAttack ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
        <CardContent className="p-5 flex items-center gap-4">
          {underAttack ? (
            <>
              <ShieldAlert className="h-10 w-10 text-red-600 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold text-red-900">Activité suspecte détectée</p>
                <p className="text-sm text-red-700">
                  {stats.bruteForceAlerts.length} adresse{stats.bruteForceAlerts.length > 1 ? "s" : ""} IP avec ≥ 5 échecs de connexion dans la dernière heure.
                </p>
              </div>
            </>
          ) : (
            <>
              <ShieldCheck className="h-10 w-10 text-green-600 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold text-green-900">Aucune attaque en cours</p>
                <p className="text-sm text-green-700">
                  Aucun pic anormal de tentatives échouées sur la dernière heure.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Échecs de connexion (24h)"
          value={stats.failed24h}
          icon={XCircle}
          sub={`${stats.failed7d} sur 7 jours`}
          tone={stats.failed24h > 20 ? "danger" : stats.failed24h > 5 ? "warn" : "default"}
        />
        <StatCard
          title="Connexions réussies (24h)"
          value={stats.successes24h}
          icon={LogIn}
          tone="success"
        />
        <StatCard
          title="Rate-limits déclenchés (24h)"
          value={stats.rateLimit24h}
          icon={AlertTriangle}
          tone={stats.rateLimit24h > 0 ? "warn" : "default"}
        />
        <StatCard
          title="Exports RGPD (30j)"
          value={stats.exports30d}
          icon={Download}
          sub={`${stats.totalAudit} événements au total`}
        />
      </div>

      {/* Alertes brute-force */}
      {stats.bruteForceAlerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              Alertes brute-force (dernière heure)
            </CardTitle>
            <CardDescription>Adresses IP ayant accumulé au moins 5 échecs en moins d'une heure.</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b">
                <tr>
                  <th className="pb-2">IP</th>
                  <th className="pb-2">Échecs</th>
                  <th className="pb-2">Dernier essai</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.bruteForceAlerts.map((a, i) => (
                  <tr key={i}>
                    <td className="py-2 font-mono text-xs">{a.ipMasked}</td>
                    <td className="py-2"><Badge variant="destructive">{a.count}</Badge></td>
                    <td className="py-2 text-muted-foreground text-xs">
                      {new Date(a.lastAt).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Top IPs et emails sur 7j */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top IP en échec (7j)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topFailedIps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun échec sur la période.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.topFailedIps.map((row, i) => (
                  <li key={i} className="flex items-center justify-between border-b pb-1 last:border-0">
                    <span className="font-mono text-xs">{row.ipMasked}</span>
                    <Badge variant={row.count >= 5 ? "destructive" : "secondary"}>{row.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top comptes ciblés (7j)</CardTitle>
            <CardDescription>
              Comptes les plus visés par des tentatives échouées — pseudonymisés (FNV-1a) pour
              respecter la minimisation des données.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topFailedAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun compte ciblé.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.topFailedAccounts.map((row, i) => (
                  <li key={i} className="flex items-center justify-between border-b pb-1 last:border-0">
                    <span className="font-mono text-xs">{row.accountHash}</span>
                    <Badge variant={row.count >= 5 ? "destructive" : "secondary"}>{row.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline des événements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Journal d'audit (30 derniers événements)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Utilisateur</th>
                  <th className="px-4 py-2">IP</th>
                  <th className="px-4 py-2">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      Aucun événement enregistré.
                    </td>
                  </tr>
                ) : (
                  stats.recentEvents.map((evt) => {
                    const cfg = ACTION_LABELS[evt.action] || { label: evt.action, tone: "info" as const }
                    return (
                      <tr key={evt.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(evt.createdAt).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${toneClass(cfg.tone)}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {evt.actorRef || "—"}
                          {evt.targetRef && evt.targetRef !== evt.actorRef ? ` → ${evt.targetRef}` : ""}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">{evt.ipMasked || "—"}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground max-w-md truncate">
                          {evt.detail || "—"}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mesures actives */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mesures de sécurité actives</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              Mots de passe hashés avec bcrypt (cost 12)
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              Rate-limiting : 10 tentatives de connexion / min / IP — 5 inscriptions / min / IP — 10 diagnostics / min / IP
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              Headers HTTP de sécurité : CSP, HSTS (prod), X-Frame-Options, Referrer-Policy
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              Vérification de l'ancien mot de passe avant changement
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              Journalisation complète des événements sensibles (audit log)
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              Validation stricte des entrées via Zod (anti-injection)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
