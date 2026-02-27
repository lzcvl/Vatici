"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Search, Menu, X, LogOut, User, Settings, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n"
import { formatBRL } from "@/lib/mock-data"
import { apiGetAuth } from "@/lib/api"
import { VaticiLogo } from "./vatici-logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    if (session?.accessToken) {
      apiGetAuth<{ balance: number }>('/me/balance', session.accessToken)
        .then((data) => setBalance(data.balance))
        .catch(() => setBalance(null))
    }
  }, [session?.accessToken])

  const navItems = [
    { href: "/", label: t("nav.markets") },
    { href: "/portfolio", label: t("nav.portfolio") },
    { href: "/atividade", label: t("nav.activity") },
  ]

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <VaticiLogo height={28} className="text-foreground sm:hidden" />
          <VaticiLogo height={32} className="hidden text-foreground sm:block" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Search + Actions */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const q = searchQuery.trim()
                router.push(q ? `/?q=${encodeURIComponent(q)}` : "/")
                setSearchOpen(false)
              }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("nav.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-48 rounded-lg border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary lg:w-64"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery("")
                }}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Search className="h-5 w-5" />
            </button>
          )}

            {/* Criar Mercado (desktop, logged in) */}
          {session?.user && (
            <Link href="/criar" className="hidden md:block">
              <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                Criar
              </Button>
            </Link>
          )}

          {/* Auth Buttons / User Menu */}
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-foreground"
                >
                  {balance !== null && (
                    <span className="hidden rounded-md bg-success/10 px-2 py-0.5 font-mono text-xs font-semibold text-success sm:inline">
                      {formatBRL(balance)}
                    </span>
                  )}
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {session.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card">
                <DropdownMenuItem asChild>
                  <Link href="/portfolio" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("nav.portfolio")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/conta" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t("account.title")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  {t("auth.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/cadastro">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {t("nav.signup")}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-muted-foreground md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {!session?.user && (
              <div className="mt-2 flex gap-2">
                <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link href="/cadastro" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full bg-primary text-primary-foreground">
                    {t("nav.signup")}
                  </Button>
                </Link>
              </div>
            )}
            {session?.user && (
              <div className="mt-2 flex flex-col gap-2">
                <Link
                  href="/criar"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Criar Mercado
                </Link>
                <div className="flex items-center justify-between rounded-lg bg-success/10 px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t("portfolio.balance")}</span>
                  <span className="font-mono text-sm font-semibold text-success">
                    {balance !== null ? formatBRL(balance) : '...'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" })
                    setMobileMenuOpen(false)
                  }}
                  className="rounded-lg px-4 py-3 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  {t("auth.logout")}
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
