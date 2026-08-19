/** @type {import('next').NextConfig} */
// next.config.js utilise CommonJS, comme la configuration existante du projet.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require("@sentry/nextjs")

const isProd = process.env.NODE_ENV === "production"
const uploadSentrySourceMaps = process.env.SENTRY_UPLOAD_SOURCEMAPS === "1"

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // L'auditeur XSS des navigateurs legacy est obsolète et introduisait ses
  // propres failles : la CSP à nonce (cf. proxy.ts) est la protection réelle.
  { key: "X-XSS-Protection", value: "0" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  })
}

const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: "cesi-3k",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  sourcemaps: {
    // Les source maps contiennent le code source : leur envoi doit être
    // explicitement autorisé dans l'environnement de build de la CI.
    disable: !uploadSentrySourceMaps,
  },
  release: {
    create: uploadSentrySourceMaps,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
