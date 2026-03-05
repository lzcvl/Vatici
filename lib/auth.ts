import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compareSync } from "bcryptjs"
import { SignJWT } from "jose"
import { findUserByEmail, updateUserIp } from "./db/users"
import { loginSchema } from "./zod-schemas"
import { headers } from "next/headers"

const AUTH_SECRET = process.env.AUTH_SECRET
if (!AUTH_SECRET) throw new Error('AUTH_SECRET environment variable is not set')

/** Creates a short-lived HS256 JWT for authenticating requests to the backend API */
async function createBackendToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(AUTH_SECRET))
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await findUserByEmail(parsed.data.email)
        if (!user) return null

        if (user.is_banned) {
          throw new Error("Sua conta foi suspensa.")
        }

        const passwordMatch = compareSync(parsed.data.password, user.password_hash)
        if (!passwordMatch) return null

        try {
          // Extract IP to update last_ip
          const hdrs = await headers()
          const ip = hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
            hdrs.get("x-real-ip") || "127.0.0.1"
          await updateUserIp(user.id, ip)
        } catch (err) {
          console.error('[Auth] failed to get headers for ip:', err)
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Create a backend API token signed with AUTH_SECRET (verified by Railway backend)
        token.backendToken = await createBackendToken(user.id as string)
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      // Expose backend token to the client for API calls
      session.accessToken = token.backendToken as string | undefined
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: AUTH_SECRET,
})
