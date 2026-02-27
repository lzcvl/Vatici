"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Plus, Trash2, ChevronDown } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { apiPostAuth } from "@/lib/api"
import { Button } from "@/components/ui/button"

const CATEGORIES = [
  { value: "politica", label: "Política" },
  { value: "esportes", label: "Esportes" },
  { value: "cripto", label: "Cripto" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "ciencia", label: "Ciência" },
  { value: "entretenimento", label: "Entretenimento" },
  { value: "economia", label: "Economia" },
  { value: "geral", label: "Geral" },
]

export function CreateMarketPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [question, setQuestion] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("geral")
  const [marketType, setMarketType] = useState<"binary" | "multi">("binary")
  const [closesAt, setClosesAt] = useState("")
  const [answers, setAnswers] = useState(["", ""])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not logged in (useEffect avoids calling router.push during SSR)
  useEffect(() => {
    if (session !== undefined && !session?.user) {
      router.push("/login")
    }
  }, [session, router])

  if (!session?.user) return null

  function addAnswer() {
    if (answers.length < 6) setAnswers([...answers, ""])
  }

  function removeAnswer(idx: number) {
    if (answers.length <= 2) return
    setAnswers(answers.filter((_, i) => i !== idx))
  }

  function updateAnswer(idx: number, value: string) {
    const next = [...answers]
    next[idx] = value
    setAnswers(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!question.trim()) return setError("A pergunta é obrigatória.")
    if (!closesAt) return setError("A data de encerramento é obrigatória.")
    if (marketType === "multi" && answers.some((a) => !a.trim()))
      return setError("Preencha todas as opções de resposta.")

    setIsSubmitting(true)
    try {
      const body = {
        question: question.trim(),
        description: description.trim(),
        category,
        marketType,
        closesAt: new Date(closesAt).toISOString(),
        ...(marketType === "multi" && { answers: answers.map((a) => a.trim()) }),
      }

      const result = await apiPostAuth<{ id: string }>("/markets", body, session!.accessToken!)
      router.push(`/mercado/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar mercado.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Min date: tomorrow
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split("T")[0]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-foreground">Criar Mercado</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Crie uma pergunta de previsão para a comunidade apostar.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de mercado */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Tipo de mercado
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMarketType("binary")}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                marketType === "binary"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
              }`}
            >
              <div className="font-semibold">Binário</div>
              <div className="mt-0.5 text-xs opacity-70">Sim / Não</div>
            </button>
            <button
              type="button"
              onClick={() => setMarketType("multi")}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                marketType === "multi"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
              }`}
            >
              <div className="font-semibold">Multi-escolha</div>
              <div className="mt-0.5 text-xs opacity-70">Várias opções</div>
            </button>
          </div>
        </div>

        {/* Pergunta */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Pergunta <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: O Brasil vai ganhar a Copa do Mundo 2026?"
            maxLength={200}
            className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">{question.length}/200</div>
        </div>

        {/* Descrição */}
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexto adicional sobre o mercado (opcional)"
            rows={3}
            maxLength={500}
            className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Categoria + Data */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Categoria
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none rounded-lg border border-border bg-secondary px-4 py-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Encerra em <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              min={minDateStr}
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        {/* Opções (multi-escolha) */}
        {marketType === "multi" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Opções de resposta <span className="text-destructive">*</span>
            </label>
            <div className="space-y-2">
              {answers.map((answer, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => updateAnswer(idx, e.target.value)}
                    placeholder={`Opção ${idx + 1}`}
                    maxLength={100}
                    className="flex-1 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeAnswer(idx)}
                    disabled={answers.length <= 2}
                    className="rounded-lg border border-border bg-secondary p-2.5 text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {answers.length < 6 && (
              <button
                type="button"
                onClick={addAnswer}
                className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Plus className="h-4 w-4" />
                Adicionar opção
              </button>
            )}
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Criando..." : "Criar Mercado"}
          </Button>
        </div>
      </form>
    </div>
  )
}
