import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos e condições de uso da plataforma VATICI.",
  alternates: { canonical: "https://vatici.com/termos" },
}

const UPDATED = "1 de março de 2026"

export default function TermosPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Termos de Uso</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: {UPDATED}</p>

      <p className="mt-6 text-muted-foreground leading-relaxed">
        Ao acessar ou utilizar a plataforma VATICI, você concorda com os termos descritos
        neste documento. Leia com atenção antes de criar uma conta.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        O uso da VATICI implica aceitação integral destes Termos de Uso. Caso não concorde
        com qualquer disposição, não utilize a plataforma.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        A VATICI é uma plataforma de simulação de mercados de previsão. Todos os saldos
        e transações são virtuais e não representam dinheiro real. A plataforma é
        fornecida para fins educacionais e de entretenimento.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">3. Elegibilidade</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Para utilizar a VATICI você deve ter pelo menos 18 anos de idade e capacidade
        legal para celebrar contratos. Ao criar uma conta, você declara que atende
        a esses requisitos.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">4. Conta do Usuário</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Você é responsável por manter a confidencialidade de suas credenciais de acesso
        e por todas as atividades realizadas em sua conta. Notifique imediatamente a
        VATICI em caso de uso não autorizado.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">5. Conduta do Usuário</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        É proibido utilizar a plataforma para atividades ilegais, manipulação de mercados,
        criação de múltiplas contas ou qualquer atividade que prejudique outros usuários
        ou a integridade da plataforma.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">6. Limitação de Responsabilidade</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        A VATICI é fornecida "como está", sem garantias de qualquer natureza. Não nos
        responsabilizamos por perdas decorrentes do uso da plataforma, interrupções
        de serviço ou imprecisões nas informações apresentadas.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">7. Alterações nos Termos</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Reservamos o direito de modificar estes termos a qualquer momento. Alterações
        significativas serão comunicadas por email. O uso continuado após a notificação
        constitui aceitação dos novos termos.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">8. Foro</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Estes termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca
        de São Paulo — SP para dirimir quaisquer disputas.
      </p>
    </article>
  )
}
