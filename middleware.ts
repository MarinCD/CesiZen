import { withAuth } from "next-auth/middleware"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rateLimit"

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    if (pathname.startsWith("/admin") && token?.role !== "ADMINISTRATEUR") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === "/api/auth/callback/credentials" && req.method === "POST") {
    const limited = rateLimit(req, { windowMs: 60_000, max: 10, keyPrefix: "login" })
    if (limited) return limited
    return NextResponse.next()
  }

  return (authMiddleware as any)(req)
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profil/:path*",
    "/historique/:path*",
    "/tracker/:path*",
    "/admin/:path*",
    "/api/auth/callback/credentials",
  ],
}
