import Link from "next/link"
import { Heart } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary mb-8">
        <Heart className="h-7 w-7" aria-hidden="true" />
        CESIZen
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
