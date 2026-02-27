import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    /** HS256 JWT for authenticating requests to the Hono backend on Railway */
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Stored in the NextAuth JWT cookie, exposed as session.accessToken */
    backendToken?: string
  }
}
