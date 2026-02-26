"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useI18n } from "@/lib/i18n"
import { forgotPasswordAction } from "@/lib/auth-actions"
import { Button } from "@/components/ui/button"
import { OrigamiDiamond } from "@/components/vatici/origami-icons"
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"

export default function EsqueciSenhaPage() {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await forgotPasswordAction(formData)
      if (result.success) {
        setSent(true)
      } else {
        setError(result.error || "Erro ao enviar email")
      }
    })
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed right-10 top-32 text-primary/[0.03]">
        <OrigamiDiamond className="h-64 w-64" />
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
            <h1 className="text-2xl font-bold text-foreground">{t("auth.forgotPassword")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {"Informe seu email para receber o link de redefinicao."}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <p className="text-center text-sm leading-relaxed text-muted-foreground">
                {t("auth.resetSent")}
              </p>
              <Link href="/login">
                <Button variant="outline" className="gap-2 border-border text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                  {t("auth.login")}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

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

              <Button
                type="submit"
                disabled={isPending}
                className="h-11 w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
              >
                {isPending ? t("general.loading") : t("auth.sendResetLink")}
              </Button>
            </form>
          )}
        </div>

        {/* Back to login */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="flex items-center justify-center gap-1 font-semibold text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  )
}
