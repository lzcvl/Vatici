import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Documentação",
  description: "Guia completo para usar a plataforma VATICI: primeiros passos, como apostar, resolução de mercados e mais.",
  alternates: { canonical: "https://vatici.com/documentacao" },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  )
}

export default function DocumentacaoPage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Documentação</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Tudo o que você precisa saber para operar na VATICI.
      </p>

      {/* Quick nav */}
      <nav className="mt-6 flex flex-wrap gap-2">
        {["Primeiros passos", "Mercados", "Apostas", "Resolução", "Saldo"].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(/ /g, "-")}`}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            {item}
          </a>
        ))}
      </nav>

      <Section title="Primeiros passos">
        <p>
          1. <Link href="/cadastro" className="text-primary hover:underline">Crie uma conta</Link> —
          preencha nome, email e senha. Você receberá R$10.000 em créditos de demonstração automaticamente.
        </p>
        <p>
          2. <strong className="text-foreground">Explore os mercados</strong> na página inicial.
          Use as categorias para filtrar por tema de interesse.
        </p>
        <p>
          3. <strong className="text-foreground">Faça sua primeira aposta</strong> — clique em SIM ou NÃO
          em qualquer mercado e defina o valor que deseja investir.
        </p>
      </Section>

      <Section title="Mercados">
        <p>
          Cada mercado é uma pergunta sobre um evento futuro. Existem dois tipos:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">Binário</strong> — resposta Sim ou Não. Ex: "O Brasil vai ganhar a Copa 2026?"</li>
          <li><strong className="text-foreground">Múltipla escolha</strong> — várias opções. Ex: "Quem vai vencer as eleições?"</li>
        </ul>
        <p>
          A <strong className="text-foreground">probabilidade</strong> mostrada em cada mercado representa
          o consenso atual dos participantes — quanto mais dinheiro em SIM, maior a probabilidade exibida.
        </p>
        <p>
          Todo mercado tem uma <strong className="text-foreground">data de fechamento</strong>. Após essa data,
          novas apostas não são aceitas e o processo de resolução é iniciado.
        </p>
      </Section>

      <Section title="Apostas">
        <p>
          Ao apostar, você compra <strong className="text-foreground">cotas</strong> (shares) de um resultado.
          O preço de cada cota varia de R$0,01 a R$1,00, refletindo a probabilidade implícita.
        </p>
        <p>
          <strong className="text-foreground">Payout potencial</strong>: se o mercado for resolvido em seu favor,
          você recebe proporcionalmente ao total investido no pool dividido pelo total de cotas vencedoras.
        </p>
        <p>
          Você pode acompanhar suas posições abertas na página de{" "}
          <Link href="/portfolio" className="text-primary hover:underline">Portfólio</Link>.
        </p>
      </Section>

      <Section title="Resolução">
        <p>
          Quando um mercado fecha, o processo de resolução segue estas etapas:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Dois modelos de IA (GROQ e Gemini) analisam o resultado independentemente.</li>
          <li>Se ambos concordam com confiança acima de 70%, o resultado é proposto.</li>
          <li>Criador do mercado e comunidade têm 24 horas para contestar.</li>
          <li>Com menos de 5 contestações, o resultado é finalizado e os payouts creditados.</li>
          <li>Com 5+ contestações, o mercado entra em revisão manual.</li>
        </ol>
      </Section>

      <Section title="Saldo">
        <p>
          Seu saldo é exibido no canto superior direito da tela. Todo novo usuário
          recebe R$10.000 em créditos iniciais.
        </p>
        <p>
          As transações (apostas, ganhos) ficam registradas na página de{" "}
          <Link href="/atividade" className="text-primary hover:underline">Atividade</Link>.
        </p>
        <p className="text-xs border border-border rounded-lg p-3 bg-muted/30">
          ℹ️ O saldo atual é virtual para fins de demonstração. Nenhum valor real é movimentado.
        </p>
      </Section>
    </article>
  )
}
