"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n"
import { formatBRL, formatDate } from "@/lib/mock-data"
import { apiGetAuth } from "@/lib/api"
import { User, Shield, Bell, Trash2, Check, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

type Tab = "profile" | "security" | "preferences"

export function AccountPage() {
  const { t, locale } = useI18n()
  const { data: session } = useSession()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  // Profile form
  const [name, setName] = useState(session?.user?.name || "")
  const [email] = useState(session?.user?.email || "")
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    if (session?.accessToken) {
      apiGetAuth<{ createdAt: string }>('/me/profile', session.accessToken)
        .then((data) => setCreatedAt(data.createdAt))
        .catch(() => setCreatedAt(null))
      apiGetAuth<{ balance: number }>('/me/balance', session.accessToken)
        .then((data) => setBalance(data.balance))
        .catch(() => setBalance(null))
    }
  }, [session?.accessToken])

  // Security form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true)

  useEffect(() => {
    if (session !== undefined && !session?.user) {
      router.push("/login")
    }
  }, [session, router])

  if (!session?.user) return null

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError("")
    setPasswordChanged(false)

    if (newPassword.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(t("auth.errors.passwordMismatch"))
      return
    }

    setPasswordChanged(true)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmNewPassword("")
    setTimeout(() => setPasswordChanged(false), 3000)
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: t("account.profile"), icon: <User className="h-4 w-4" /> },
    { key: "security", label: t("account.security"), icon: <Shield className="h-4 w-4" /> },
    { key: "preferences", label: t("account.preferences"), icon: <Bell className="h-4 w-4" /> },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t("account.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {createdAt ? `${t("account.memberSince")} ${formatDate(createdAt, locale)}` : "\u00a0"}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 rounded-xl border border-border bg-secondary/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-6 text-lg font-semibold text-foreground">{t("account.profile")}</h2>

            {/* Avatar */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
                {name[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-medium text-foreground">{name}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>

            {/* Name field */}
            <div className="mb-4">
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("account.nameLabel")}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Email field (read-only) */}
            <div className="mb-6">
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("account.emailLabel")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                className="h-10 w-full cursor-not-allowed rounded-lg border border-border bg-secondary/50 px-3 text-sm text-muted-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                O email nao pode ser alterado por aqui.
              </p>
            </div>

            {/* Balance info */}
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("portfolio.balance")}</span>
                <span className="font-mono text-lg font-semibold text-success">
                  {balance !== null ? formatBRL(balance) : '...'}
                </span>
              </div>
            </div>
          </div>

          {/* Success message */}
          {profileSaved && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
              <Check className="h-4 w-4" />
              {t("account.profileSaved")}
            </div>
          )}

          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            {t("account.saveProfile")}
          </Button>
        </form>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-6 text-lg font-semibold text-foreground">{t("account.changePassword")}</h2>

            {/* Current Password */}
            <div className="mb-4">
              <label htmlFor="currentPw" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("account.currentPassword")}
              </label>
              <div className="relative">
                <input
                  id="currentPw"
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="mb-4">
              <label htmlFor="newPw" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("account.newPassword")}
              </label>
              <div className="relative">
                <input
                  id="newPw"
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-10 w-full rounded-lg border border-border bg-secondary px-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="mb-2">
              <label htmlFor="confirmNewPw" className="mb-1.5 block text-sm font-medium text-foreground">
                {t("account.confirmNewPassword")}
              </label>
              <input
                id="confirmNewPw"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {passwordError && (
              <p className="mt-2 text-sm text-destructive">{passwordError}</p>
            )}
          </div>

          {passwordChanged && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
              <Check className="h-4 w-4" />
              {t("account.passwordChanged")}
            </div>
          )}

          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            {t("account.changePassword")}
          </Button>
        </form>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          {/* Notifications */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-6 text-lg font-semibold text-foreground">{t("account.preferences")}</h2>

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{t("account.notifications")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("account.notificationsSub")}</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  emailNotifications ? "bg-primary" : "bg-border"
                }`}
                role="switch"
                aria-checked={emailNotifications}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
                    emailNotifications ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-destructive/30 bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold text-destructive">{t("account.deleteAccount")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{t("account.deleteAccountSub")}</p>
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("account.deleteBtn")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
