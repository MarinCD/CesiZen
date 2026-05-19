import { vi } from "vitest"

// Stub Next.js server internals not available in Vitest Node environment
vi.stubEnv("NEXTAUTH_SECRET", "test-secret-for-vitest")
vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000")
vi.stubEnv("DATABASE_URL", process.env.DATABASE_URL ?? "mysql://test:test@localhost:3306/test")
