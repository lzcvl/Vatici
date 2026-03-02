import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Suporte",
  description: "Central de ajuda e contato da VATICI. Respostas rápidas para as principais dúvidas sobre a plataforma.",
  alternates: { canonical: "https://vatici.com/suporte" },
}

const faqs = [
  {
    q: "Como criar uma conta?",
    a: (
      <>
        Acesse <Link href="/cadastro" className="text-primary hover:underline">/cadastro</Link>,
        preencha nome, email e senha. Você receberá um email de boas-vindas e R$10.000 em créditos
        de demonstração imediatamente.
      </>
    ),
    aText: "Acesse /cadastro, preencha nome, email e senha. Você receberá um email de boas-vindas e R$10.000 em créditos de demonstração imediatamente.",
  },
  {
    q: "Esqueci minha senha. O que faço?",
    a: (
      <>
        Na página de <Link href="/login" className="text-primary hover:underline">login</Link>,
        clique em "Esqueceu sua senha?". Insira seu email e você receberá um link de redefinição
        válido por 1 hora.
      </>
    ),
    aText: 'Na página de login, clique em "Esqueceu sua senha?". Insira seu email e você receberá um link de redefinição válido por 1 hora.',
  },
  {
    q: "O dinheiro é real?",
    a: "Não. Todos os saldos e transações na VATICI são virtuais para fins de simulação e entretenimento. Nenhum valor real é movimentado.",
    aText: "Não. Todos os saldos e transações na VATICI são virtuais para fins de simulação e entretenimento. Nenhum valor real é movimentado.",
  },
  {
    q: "Como funciona a resolução de um mercado?",
    a: "Quando um mercado fecha, dois modelos de IA analisam o resultado independentemente. Se concordam, o resultado é proposto. A comunidade tem 24 horas para contestar antes da liquidação final.",
    aText: "Quando um mercado fecha, dois modelos de IA analisam o resultado independentemente. Se concordam, o resultado é proposto. A comunidade tem 24 horas para contestar antes da liquidação final.",
  },
  {
    q: "Posso criar meu próprio mercado?",
    a: (
      <>
        Sim! Acesse <Link href="/criar" className="text-primary hover:underline">Criar Mercado</Link>{" "}
        e preencha os detalhes. Mercados criados ficam visíveis para toda a comunidade.
      </>
    ),
    aText: "Sim! Acesse Criar Mercado e preencha os detalhes. Mercados criados ficam visíveis para toda a comunidade.",
  },
  {
    q: "Como solicitar exclusão da minha conta?",
    a: "Entre em contato pelo email abaixo informando seu nome e email cadastrado. Processamos a solicitação em até 30 dias conforme a LGPD.",
    aText: "Entre em contato pelo email suporte@vatici.com informando seu nome e email cadastrado. Processamos a solicitação em até 30 dias conforme a LGPD.",
  },
]

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.aText,
    },
  })),
}

export default function SuportePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Suporte</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Dúvidas? Consulte as perguntas frequentes abaixo ou entre em contato diretamente.
        </p>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Perguntas Frequentes</h2>
          <div className="mt-4 space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-medium text-foreground">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="mt-12 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Contato direto</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Não encontrou o que precisava? Envie um email para:
          </p>
          <a
            href="mailto:suporte@vatici.com"
            className="mt-3 inline-block text-primary font-medium hover:underline"
          >
            suporte@vatici.com
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            Respondemos em até 2 dias úteis.
          </p>
        </section>

        {/* Links úteis */}
        <section className="mt-8">
          <h2 className="text-base font-semibold text-foreground mb-3">Links úteis</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/documentacao", label: "Documentação" },
              { href: "/termos", label: "Termos de Uso" },
              { href: "/privacidade", label: "Privacidade" },
              { href: "/sobre", label: "Sobre a VATICI" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
