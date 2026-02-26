"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n"
import { signupAction } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import { OrigamiStar } from "@/components/vatici/origami-icons"
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react"

export default function CadastroPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await signupAction(formData)
      if (result.success) {
        router.push("/")
        router.refresh()
      } else {
        setError(result.error || "Erro ao criar conta")
      }
    })
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed -left-16 bottom-10 text-accent/[0.03]">
        <OrigamiStar className="h-80 w-80" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/vatici-logo.png"
              alt="VATICI"
              width={140}
              height={42}
              className="h-10 w-auto brightness-0 invert"
            />
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{t("auth.welcomeNew")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.welcomeNewSub")}</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {t(error as Parameters<typeof t>[0])}
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                {t("auth.name")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Seu nome"
                  className="h-11 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                {t("auth.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@email.com"
                  className="h-11 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                {t("auth.password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 caracteres"
                  className="h-11 w-full rounded-lg border border-border bg-secondary pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                {t("auth.confirmPassword")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Confirme sua senha"
                  className="h-11 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="h-11 w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              {isPending ? t("general.loading") : t("auth.signupBtn")}
            </Button>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            {t("auth.loginBtn")}
          </Link>
        </p>
      </div>
    </div>
  )
}
