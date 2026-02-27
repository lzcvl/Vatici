"use client"

import { useState } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { formatBRL } from "@/lib/mock-data"
import { apiGetAdmin, apiPostAdmin } from "@/lib/api"
import type { FrontendMarket } from "@/lib/api-types"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react"

type ResolveState = { marketId: string; resolving: boolean; done: boolean; error: string | null }

export function AdminPage() {
  const { locale } = useI18n()
  const [secret, setSecret] = useState("")
  const [secretInput, setSecretInput] = useState("")
  const [markets, setMarkets] = useState<FrontendMarket[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [resolveStates, setResolveStates] = useState<Record<string, ResolveState>>({})
  const [customResults, setCustomResults] = useState<Record<string, string>>({})

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    const s = secretInput.trim()
    if (!s) return
    setLoading(true)
    setFetchError(null)
    try {
      const [disputed, uncertain] = await Promise.all([
        apiGetAdmin<FrontendMarket[]>('/admin/markets?status=disputed', s),
        apiGetAdmin<FrontendMarket[]>('/admin/markets?status=ai_uncertain', s),
      ])
      setMarkets([...disputed, ...uncertain])
      setSecret(s)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Erro ao conectar. Verifique o secret.')
    } finally {
      setLoading(false)
    }
  }

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

  // Not authenticated yet
  if (!secret) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="mb-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
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
                placeholder="ADMIN_SECRET"
                className="h-10 w-full rounded-lg border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            {fetchError && (
              <p className="text-sm text-destructive">{fetchError}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Conectando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Painel Admin</h1>
        <Button
          variant="outline"
          size="sm"
          className="border-border text-muted-foreground"
          onClick={() => { setSecret(""); setMarkets([]) }}
        >
          Sair
        </Button>
      </div>

      {markets.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
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
                className="rounded-xl border border-border bg-card p-5"
              >
                {/* Status badge */}
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                    market.status === 'disputed'
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
      )}
    </div>
  )
}
