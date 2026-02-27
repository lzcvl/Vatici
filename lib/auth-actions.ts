"use server"

import { headers } from "next/headers"
import { hashSync } from "bcryptjs"
import { signIn, signOut } from "./auth"
import { loginSchema, signupSchema, forgotPasswordSchema } from "./zod-schemas"
import { findUserByEmail, createUser } from "./db/users"
import { verifyTurnstile } from "./turnstile"
import { checkRateLimit } from "./rate-limit"

export type AuthResult = {
  success: boolean
  error?: string
}

async function getClientIp(): Promise<string> {
  const hdrs = await headers()
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    "127.0.0.1"
  )
}

export async function loginAction(formData: FormData): Promise<AuthResult> {
  const ip = await getClientIp()

  // Rate limit: 10 login attempts per IP per 15 minutes
  if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return { success: false, error: "auth.errors.tooManyAttempts" }
  }

  // Turnstile verification
  const cfToken = formData.get("cf-turnstile-response") as string | null
  const turnstileOk = await verifyTurnstile(cfToken)
  if (!turnstileOk) {
    return { success: false, error: "auth.errors.captchaFailed" }
  }

  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
    return { success: true }
  } catch {
    return { success: false, error: "auth.errors.invalidCredentials" }
  }
}

export async function signupAction(formData: FormData): Promise<AuthResult> {
  const ip = await getClientIp()

  // Rate limit: 5 signups per IP per hour
  if (!checkRateLimit(`signup:${ip}`, 5, 60 * 60 * 1000)) {
    return { success: false, error: "auth.errors.tooManyAttempts" }
  }

  // Turnstile verification
  const cfToken = formData.get("cf-turnstile-response") as string | null
  const turnstileOk = await verifyTurnstile(cfToken)
  if (!turnstileOk) {
    return { success: false, error: "auth.errors.captchaFailed" }
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  }

  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const existing = await findUserByEmail(parsed.data.email)
  if (existing) {
    return { success: false, error: "auth.errors.emailExists" }
  }

  const passwordHash = hashSync(parsed.data.password, 10)
  await createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
  })

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
    return { success: true }
  } catch {
    return { success: true }
  }
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<AuthResult> {
  const raw = { email: formData.get("email") as string }

  const parsed = forgotPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  // Mock: always return success (no real email sent)
  return { success: true }
}

export async function resetPasswordAction(): Promise<AuthResult> {
  // Mock: always return success
  return { success: true }
}

export async function logoutAction() {
  await signOut({ redirect: false })
}
