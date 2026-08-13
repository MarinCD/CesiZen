/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production"

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

module.exports = nextConfig
