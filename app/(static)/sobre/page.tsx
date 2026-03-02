import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sobre a VATICI",
  description: "Conheça a VATICI, a plataforma brasileira de mercados de previsão. Preveja eventos, aposte com créditos virtuais e acompanhe o consenso da comunidade.",
  alternates: { canonical: "https://vatici.com/sobre" },
}

export default function SobrePage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Sobre a VATICI</h1>

      <p className="mt-4 text-muted-foreground leading-relaxed">
        A VATICI é uma plataforma de mercados de previsão onde qualquer pessoa pode
        negociar contratos sobre eventos futuros — política, esportes, economia, tecnologia e mais.
        Ao invés de achismos, aqui você usa informação e julgamento para lucrar.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">Como funciona</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Cada mercado é uma pergunta com resposta binária (Sim/Não) ou múltipla escolha.
        Você compra cotas SIM ou NÃO refletindo sua crença na probabilidade do evento.
        Quando o mercado é resolvido, quem apostou corretamente recebe proporcionalmente
        ao volume total investido.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">Mecanismo de precificação</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Usamos o modelo CPMM (Constant Product Market Maker), o mesmo utilizado por
        plataformas como Manifold Markets. O preço de cada cota reflete a probabilidade
        implícita do mercado e se ajusta automaticamente a cada nova aposta.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">Resolução por IA</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Quando um mercado fecha, dois modelos de IA independentes (GROQ e Gemini)
        analisam o resultado publicamente disponível. Se ambos concordam com alta
        confiança, o resultado é proposto automaticamente. A comunidade tem 24 horas
        para contestar antes da liquidação final.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">Conta e saldo</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Novos usuários recebem R$10.000 em créditos de demonstração para explorar
        a plataforma. O ambiente atual é de simulação — nenhum dinheiro real é
        movimentado.
      </p>
    </article>
  )
}
