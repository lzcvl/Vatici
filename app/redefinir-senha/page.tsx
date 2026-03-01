"use client"

import { Suspense, useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n"
import { resetPasswordAction } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import { OrigamiCrane } from "@/components/vatici/origami-icons"
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from "lucide-react"

function RedefinirSenhaContent() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await resetPasswordAction(formData)
      if (result.success) {
        setSuccess(true)
        setTimeout(() => router.push("/login"), 2500)
      } else {
        setError(result.error || "auth.errors.invalidResetToken")
      }
    })
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed -left-10 -bottom-10 text-primary/[0.03]">
        <OrigamiCrane className="h-72 w-72" />
      </div>

      <div className="w-full max-w-md">
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
            <h1 className="text-2xl font-bold text-foreground">{t("auth.resetPassword")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Escolha uma nova senha para sua conta.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          {!token ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-center text-sm leading-relaxed text-muted-foreground">
                {t("auth.errors.invalidResetToken")}
              </p>
              <Link href="/esqueci-senha">
                <Button variant="outline" className="border-border text-foreground">
                  {t("auth.forgotPassword")}
                </Button>
              </Link>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <p className="text-center text-sm leading-relaxed text-muted-foreground">
                {t("auth.resetSuccess")}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input type="hidden" name="token" value={token} />

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {t(error as Parameters<typeof t>[0])}
                </div>
              )}

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
                {isPending ? t("general.loading") : t("auth.resetBtn")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaContent />
    </Suspense>
  )
}
