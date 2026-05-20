import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { logAudit } from "@/lib/audit"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
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
        const ip =
          (req?.headers as any)?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
          (req?.headers as any)?.["x-real-ip"] ||
          null

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
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
}
