import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Saiba como a VATICI coleta, usa e protege seus dados pessoais em conformidade com a LGPD.",
  alternates: { canonical: "https://vatici.com/privacidade" },
}

const UPDATED = "1 de março de 2026"

export default function PrivacidadePage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: {UPDATED}</p>

      <p className="mt-6 text-muted-foreground leading-relaxed">
        Esta Política de Privacidade descreve como a VATICI coleta, usa e protege
        suas informações pessoais em conformidade com a Lei Geral de Proteção de
        Dados (LGPD — Lei nº 13.709/2018).
      </p>

      <h2 className="mt-10 text-xl font-semibold text-foreground">1. Dados Coletados</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Coletamos os dados que você fornece ao criar uma conta (nome, email, senha)
        e os dados gerados pelo uso da plataforma (apostas, posições, atividade).
        Também coletamos dados técnicos como endereço IP e informações do dispositivo
        para segurança e melhoria do serviço.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">2. Uso dos Dados</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Utilizamos seus dados para: operar e melhorar a plataforma; autenticar sua
        conta; enviar comunicações transacionais (confirmações, alertas de segurança);
        prevenir fraudes; e cumprir obrigações legais.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">3. Compartilhamento</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Não vendemos seus dados pessoais. Compartilhamos apenas com prestadores de
        serviço essenciais (hospedagem, banco de dados, email transacional) e quando
        exigido por lei.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">4. Segurança</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Adotamos medidas técnicas e organizacionais para proteger seus dados:
        senhas armazenadas com hash bcrypt, comunicação via HTTPS/TLS, tokens
        JWT de curta duração e controle de acesso baseado em funções.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">5. Seus Direitos (LGPD)</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Você tem direito a: acessar seus dados; corrigir informações incorretas;
        solicitar a exclusão da conta; revogar o consentimento; e receber seus dados
        em formato portável. Para exercer esses direitos, entre em contato pelo
        nosso suporte.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">6. Cookies</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Utilizamos cookies essenciais para autenticação de sessão. Não utilizamos
        cookies de rastreamento ou publicidade de terceiros.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">7. Retenção</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão,
        os dados são anonimizados ou removidos em até 30 dias, exceto onde a
        retenção for exigida por lei.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-foreground">8. Contato</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Para dúvidas sobre privacidade ou para exercer seus direitos, acesse
        nossa página de <a href="/suporte" className="text-primary hover:underline">Suporte</a>.
      </p>
    </article>
  )
}
