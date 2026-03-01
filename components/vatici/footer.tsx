"use client"

import Image from "next/image"
import Link from "next/link"
import { Globe } from "lucide-react"
import { useI18n, localeNames, type Locale } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OrigamiCrane } from "./origami-icons"

const FOOTER_LINKS = {
  about:   "/sobre",
  terms:   "/termos",
  privacy: "/privacidade",
  docs:    "/documentacao",
  blog:    "/blog",
  support: "/suporte",
} as const

const YEAR = 2026

export function Footer() {
  const { t, locale, setLocale } = useI18n()

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/vatici-logo.png"
                alt="VATICI"
                width={100}
                height={30}
                className="h-6 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("home.heroSub")}
            </p>
            <OrigamiCrane className="h-10 w-10 text-primary/30" />
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground">{t("footer.about")}</h4>
            <div className="flex flex-col gap-2">
              {(["about", "terms", "privacy"] as const).map((item) => (
                <Link
                  key={item}
                  href={FOOTER_LINKS[item]}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(`footer.${item}` as Parameters<typeof t>[0])}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground">{t("footer.docs")}</h4>
            <div className="flex flex-col gap-2">
              {(["docs", "blog", "support"] as const).map((item) => (
                <Link
                  key={item}
                  href={FOOTER_LINKS[item]}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(`footer.${item}` as Parameters<typeof t>[0])}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground">{t("footer.community")}</h4>
            <div className="flex flex-col gap-2">
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Twitter / X
              </a>
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Discord
              </a>
              <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Telegram
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar: copyright + language selector */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {YEAR} VATICI. {t("footer.rights")}
          </p>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs">{localeNames[locale]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card">
              {(Object.keys(localeNames) as Locale[]).map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={locale === loc ? "bg-primary/10 text-primary" : ""}
                >
                  {localeNames[loc]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </footer>
  )
}
