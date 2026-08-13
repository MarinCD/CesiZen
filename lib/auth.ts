import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { logAudit } from "@/lib/audit"
import { clientIp, rateLimit } from "@/lib/rateLimit"
import { assertSecurityEnv } from "@/lib/env"

assertSecurityEnv()

// Une session courte limite la fenêtre d'exploitation d'un jeton volé ; le
// `updateAge` la fait glisser tant que l'utilisateur reste actif.
const SESSION_MAX_AGE_SECONDS = 2 * 60 * 60
const SESSION_UPDATE_AGE_SECONDS = 15 * 60

// Un JWT porte des droits figés : sans relecture en base, un compte supprimé ou
// rétrogradé conserverait son rôle jusqu'à l'expiration du jeton.
const REVALIDATION_INTERVAL_MS = 5 * 60 * 1000

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, req) {
        const headers = (req?.headers || {}) as Record<string, string | string[] | undefined>
        const ip = clientIp({ headers })
        const email = credentials?.email?.trim().toLowerCase() || null

        // Deux compteurs complémentaires : par IP contre le bourrinage depuis une
        // machine, par compte contre un brute-force distribué qui change d'IP.
        const ipLimited = await rateLimit({ headers }, { windowMs: 60_000, max: 10, keyPrefix: "login" })
        const accountLimited = email
          ? await rateLimit(
              { headers },
              { windowMs: 15 * 60_000, max: 10, keyPrefix: "login-account", identifier: email }
            )
          : null

        if (ipLimited || accountLimited) {
          await logAudit({
            action: "RATE_LIMIT_HIT",
            ip,
            metadata: { route: "login", scope: accountLimited ? "compte" : "ip" },
          })
          return null
        }

        if (!credentials?.email || !credentials?.password) {
          await logAudit({
            action: "LOGIN_FAILED",
            ip,
            metadata: { reason: "missing_credentials", email: credentials?.email ?? null },
          })
          return null
        }

        const user = await prisma.utilisateur.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          await logAudit({
            action: "LOGIN_FAILED",
            ip,
            metadata: { reason: "unknown_email", email: credentials.email },
          })
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.motDePasse)
        if (!isValid) {
          await logAudit({
            action: "LOGIN_FAILED",
            targetId: user.id,
            ip,
            metadata: { reason: "bad_password", email: credentials.email },
          })
          return null
        }

        await prisma.$executeRaw`
          UPDATE utilisateur
          SET derniereActivite = CURRENT_TIMESTAMP(3)
          WHERE id = ${user.id}
        `

        await logAudit({
          action: "LOGIN_SUCCESS",
          actorId: user.id,
          targetId: user.id,
          ip,
        })

        return {
          id: String(user.id),
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const claims = token as any

      if (user) {
        claims.role = (user as any).role
        claims.id = user.id
        // Date d'authentification réelle : `iat` est réécrit à chaque encodage
        // et ne permet donc pas de détecter un changement de mot de passe.
        claims.authTime = Date.now()
        claims.revalidatedAt = Date.now()
        delete claims.revoked
        return token
      }

      if (claims.revoked) return token

      const lastCheck = typeof claims.revalidatedAt === "number" ? claims.revalidatedAt : 0
      if (Date.now() - lastCheck < REVALIDATION_INTERVAL_MS) return token

      const userId = Number(claims.id)
      if (!Number.isInteger(userId) || userId <= 0) {
        claims.revoked = true
        return token
      }

      try {
        const current = await prisma.utilisateur.findUnique({
          where: { id: userId },
          select: { role: true, motDePasseModifieLe: true },
        })

        // Compte supprimé : le jeton ne doit plus ouvrir aucune session.
        if (!current) {
          claims.revoked = true
          return token
        }

        const authTime = typeof claims.authTime === "number" ? claims.authTime : 0
        if (current.motDePasseModifieLe && current.motDePasseModifieLe.getTime() > authTime) {
          claims.revoked = true
          return token
        }

        claims.role = current.role
        claims.revalidatedAt = Date.now()
      } catch (error) {
        // Base indisponible : on conserve le jeton en l'état et on retentera au
        // prochain appel plutôt que de déconnecter tout le monde.
        console.error("[auth] revalidation du jeton impossible", error)
      }

      return token
    },
    async session({ session, token }) {
      // Session vide pour un jeton révoqué : next-auth ignore un objet sans clé,
      // donc getServerSession renvoie null et tous les contrôles échouent.
      if ((token as any).revoked) return {} as typeof session

      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
}
