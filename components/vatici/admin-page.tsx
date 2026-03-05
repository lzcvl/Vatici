"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { formatBRL } from "@/lib/mock-data"
import { apiGetAdmin, apiPostAdmin } from "@/lib/api"
import type { FrontendMarket, AdminStats, AdminUser } from "@/lib/api-types"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertTriangle, Loader2, Users, Receipt, ArrowRightLeft, Target, Shield, AlertCircle, Ban, Gift } from "lucide-react"

type ResolveState = { marketId: string; resolving: boolean; done: boolean; error: string | null }

export function AdminPage() {
  const { locale } = useI18n()

  // Auth state
  const [secret, setSecret] = useState("")
  const [secretInput, setSecretInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Tabs state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'markets'>('dashboard')

  // Dashboard state
  const [stats, setStats] = useState<AdminStats | null>(null)

  // Markets state
  const [markets, setMarkets] = useState<FrontendMarket[]>([])
  const [resolveStates, setResolveStates] = useState<Record<string, ResolveState>>({})
  const [customResults, setCustomResults] = useState<Record<string, string>>({})

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchUser, setSearchUser] = useState("")

  // Auto-login from localStorage if available
  useEffect(() => {
    const savedSecret = localStorage.getItem("vatici_admin_secret")
    if (savedSecret) {
      setSecretInput(savedSecret)
    }
  }, [])

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    const s = secretInput.trim()
    if (!s) return
    setLoading(true)
    setFetchError(null)
    try {
      // Parallel fetch for overview
      const [statsRes, disputed, uncertain] = await Promise.all([
        apiGetAdmin<AdminStats>('/admin/stats', s),
        apiGetAdmin<FrontendMarket[]>('/admin/markets?status=disputed', s),
        apiGetAdmin<FrontendMarket[]>('/admin/markets?status=ai_uncertain', s),
      ])

      setStats(statsRes)
      setMarkets([...disputed, ...uncertain])
      setSecret(s)
      localStorage.setItem("vatici_admin_secret", s)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao conectar. Verifique o secret.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    setSecret("")
    setStats(null)
    setMarkets([])
    setUsers([])
    localStorage.removeItem("vatici_admin_secret")
  }

  // Markets View logic
  async function handleResolve(marketId: string, result: string) {
    if (!result.trim()) return
    setResolveStates((prev) => ({
      ...prev,
      [marketId]: { marketId, resolving: true, done: false, error: null },
    }))
    try {
      await apiPostAdmin(`/admin/markets/${marketId}/resolve`, { result }, secret)
      setResolveStates((prev) => ({
        ...prev,
        [marketId]: { marketId, resolving: false, done: true, error: null },
      }))
      setMarkets((prev) => prev.filter((m) => m.id !== marketId))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao resolver'
      setResolveStates((prev) => ({
        ...prev,
        [marketId]: { marketId, resolving: false, done: false, error: msg },
      }))
    }
  }

  // Users View Logic
  async function loadUsers(search = "") {
    if (!secret) return;
    setUsersLoading(true)
    try {
      const queryParams = new URLSearchParams()
      queryParams.set('limit', '50')
      if (search) queryParams.set('search', search)

      const res = await apiGetAdmin<AdminUser[]>(`/admin/users?${queryParams.toString()}`, secret)
      setUsers(res)
    } catch (e) {
      console.error("Failed to load users", e)
    } finally {
      setUsersLoading(false)
    }
  }

  // Load users when tab is clicked
  useEffect(() => {
    if (activeTab === 'users' && users.length === 0 && secret) {
      loadUsers()
    }
  }, [activeTab, secret])

  async function toggleBan(userId: string) {
    try {
      const res = await apiPostAdmin<{ success: boolean, isBanned: boolean }>(`/admin/users/${userId}/ban`, {}, secret)
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: res.isBanned } : u))
    } catch (e) {
      console.error("Failed to ban/unban", e)
      alert("Falha ao atualizar banimento")
    }
  }

  async function giveBonus(userId: string) {
    const amtStr = prompt("Valor em Reais (BRL) para dar/remover (Ex: 100 ou -50):")
    if (!amtStr) return

    const amount = parseFloat(amtStr)
    if (isNaN(amount)) return alert("Valor inválido")

    const description = prompt("Motivo (opcional):", "Bonus/Multa manual") || ""

    try {
      const res = await apiPostAdmin<{ success: boolean, newBalance: number }>(`/admin/users/${userId}/bonus`, { amount, description }, secret)
      setUsers(users.map(u => u.id === userId ? { ...u, balance: res.newBalance } : u))
      alert("Saldo atualizado com sucesso!")
    } catch (e) {
      console.error("Failed to apply bonus", e)
      alert("Falha ao aplicar saldo")
    }
  }

  // Render Functions
  if (!secret) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Acesso Restrito</h1>
          </div>
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Admin Secret
              </label>
              <input
                type="password"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder="Insira a chave mestra..."
                className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            {fetchError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <p>{fetchError}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Autenticando...
                </span>
              ) : (
                "Entrar no Painel"
              )}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Centro de Comando
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie a plataforma Vatici</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-red-500/20 text-red-500 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          Encerrar Sessão
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Target },
          { id: 'users', label: 'Usuários & Alts', icon: Users },
          { id: 'markets', label: `Mercados (${markets.length})`, icon: Receipt }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'dashboard' | 'users' | 'markets')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Dashboard */}
      {activeTab === 'dashboard' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Usuários Totais</p>
              <div className="bg-primary/10 p-2 rounded-lg"><Users className="h-4 w-4 text-primary" /></div>
            </div>
            <h3 className="text-2xl font-bold">{stats.totalUsers.toLocaleString('pt-BR')}</h3>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Volume de Negócios</p>
              <div className="bg-success/10 p-2 rounded-lg"><Receipt className="h-4 w-4 text-success" /></div>
            </div>
            <h3 className="text-2xl font-bold">{formatBRL(stats.totalVolume)}</h3>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Mercados Criados</p>
              <div className="bg-purple-500/10 p-2 rounded-lg"><Target className="h-4 w-4 text-purple-500" /></div>
            </div>
            <h3 className="text-2xl font-bold">{stats.totalMarkets.toLocaleString('pt-BR')}</h3>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Apostas Efetuadas</p>
              <div className="bg-orange-500/10 p-2 rounded-lg"><ArrowRightLeft className="h-4 w-4 text-orange-500" /></div>
            </div>
            <h3 className="text-2xl font-bold">{stats.totalBets.toLocaleString('pt-BR')}</h3>
          </div>
        </div>
      )}

      {/* Tab: Users & Alts */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar por nome, email ou IP..."
              className="border border-border bg-secondary text-sm rounded-lg px-3 py-2 w-full max-w-sm"
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadUsers(searchUser)}
            />
            <Button onClick={() => loadUsers(searchUser)} size="sm">Buscar</Button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">Cadastrado / Último IP</th>
                  <th className="px-4 py-3 font-medium">Saldo (BRL)</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className={`border-b border-border/50 hover:bg-secondary/20 transition-colors ${u.is_banned ? 'bg-destructive/5 opacity-80' : ''}`}>
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="font-medium text-foreground truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        {u.is_banned && <span className="inline-flex mt-1 items-center gap-1 text-[10px] font-bold uppercase text-destructive bg-destructive/10 px-1.5 py-0.5 rounded"><Ban className="h-3 w-3" /> Banido</span>}
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                        <div className="text-xs font-mono text-muted-foreground truncate" title="IP de Registro">{u.registration_ip || "Desconhecido"}</div>
                        <div className="text-xs font-mono text-foreground truncate mt-0.5" title="Último IP de Login">{u.last_ip || "Desconhecido"}</div>
                      </td>
                      <td className="px-4 py-3 font-medium font-mono">{formatBRL(u.balance)}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => giveBonus(u.id)} className="p-1.5 hover:bg-success/20 text-success rounded-md transition-colors" title="Dar ou Remover Saldo">
                          <Gift className="h-4 w-4" />
                        </button>
                        <button onClick={() => toggleBan(u.id)} className={`p-1.5 rounded-md transition-colors ${u.is_banned ? 'hover:bg-success/20 text-success' : 'hover:bg-destructive/20 text-destructive'}`} title={u.is_banned ? "Desbanir Conta" : "Banir Conta"}>
                          <Ban className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Markets (Legacy Resolution UI) */}
      {activeTab === 'markets' && (
        markets.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-success/60" />
            <p className="text-sm text-muted-foreground">Nenhum mercado aguardando resolução manual.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {markets.length} mercado(s) aguardando resolução manual
            </p>
            {markets.map((market) => {
              const state = resolveStates[market.id]
              const isMulti = market.type === 'multi'
              const customResult = customResults[market.id] ?? ''

              return (
                <div
                  key={market.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  {/* Status badge */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${market.status === 'disputed'
                        ? 'bg-destructive/15 text-destructive'
                        : 'bg-warning/15 text-warning'
                      }`}>
                      {market.status === 'disputed' ? 'Disputado' : 'IA Incerta'}
                    </span>
                    <span className="text-xs text-muted-foreground">{market.category}</span>
                  </div>

                  {/* Question */}
                  <Link
                    href={`/mercado/${market.id}`}
                    target="_blank"
                    className="mb-3 block text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {market.question[locale]}
                  </Link>

                  {/* Volume */}
                  <p className="mb-4 text-xs text-muted-foreground">
                    Vol: {formatBRL(market.volume)} · Encerrou: {new Date(market.closesAt).toLocaleDateString('pt-BR')}
                  </p>

                  {/* Resolve actions */}
                  {state?.done ? (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle className="h-4 w-4" />
                      Resolvido com sucesso
                    </div>
                  ) : (
                    <>
                      {isMulti ? (
                        /* Multi-choice: show options + custom input */
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Selecione a opção vencedora:</p>
                          <div className="flex flex-col gap-1.5">
                            {market.options?.map((opt) => (
                              <button
                                key={opt.id}
                                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                onClick={() => handleResolve(market.id, opt.id)}
                                disabled={state?.resolving}
                              >
                                <span className="text-foreground">{opt.label[locale]}</span>
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(opt.probability * 100)}%
                                </span>
                              </button>
                            ))}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <input
                              type="text"
                              placeholder="UUID da resposta (manual)"
                              value={customResult}
                              onChange={(e) =>
                                setCustomResults((prev) => ({ ...prev, [market.id]: e.target.value }))
                              }
                              className="h-9 flex-1 rounded-lg border border-border bg-secondary px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleResolve(market.id, customResult)}
                              disabled={!customResult.trim() || state?.resolving}
                            >
                              Resolver
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Binary: YES / NO buttons */
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            className="flex-1 bg-success/15 text-success hover:bg-success/25"
                            onClick={() => handleResolve(market.id, 'YES')}
                            disabled={state?.resolving}
                          >
                            {state?.resolving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'SIM (YES)'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-destructive/15 text-destructive hover:bg-destructive/25"
                            onClick={() => handleResolve(market.id, 'NO')}
                            disabled={state?.resolving}
                          >
                            {state?.resolving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'NÃO (NO)'
                            )}
                          </Button>
                        </div>
                      )}

                      {state?.error && (
                        <p className="mt-2 text-xs text-destructive">{state.error}</p>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
