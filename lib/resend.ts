/**
 * Resend Email Client
 *
 * Env vars required (set in Vercel):
 *   RESEND_API_KEY        — API key from resend.com
 *   NEXT_PUBLIC_APP_URL   — e.g. https://vatici.com
 *   EMAIL_FROM            — e.g. VATICI <noreply@vatici.com>
 *                           (domain must be verified in Resend dashboard)
 */

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM || "VATICI <noreply@vatici.com>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://vatici.com"

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/redefinir-senha?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Redefinir sua senha — VATICI",
    html: passwordResetHtml(resetUrl),
  })
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Bem-vindo à VATICI!",
    html: welcomeHtml(name),
  })
}

// ─── Email Templates ─────────────────────────────────────────────────────────

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VATICI</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">

          <!-- Header -->
          <tr>
            <td style="background:#09090b;padding:28px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">VATICI</span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f4f4f5;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.6;">
                Este email foi enviado automaticamente. Por favor, nao responda.<br />
                &copy; ${new Date().getFullYear()} VATICI &mdash; <a href="${APP_URL}" style="color:#a1a1aa;">${APP_URL.replace("https://", "")}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function passwordResetHtml(resetUrl: string): string {
  return base(`
    <h1 style="margin:0 0 8px;color:#09090b;font-size:22px;font-weight:700;">Redefinir sua senha</h1>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      Recebemos uma solicitacao para redefinir a senha da sua conta VATICI.
      Clique no botao abaixo para criar uma nova senha.
    </p>
    <a href="${resetUrl}"
       style="display:inline-block;background:#09090b;color:#ffffff;text-decoration:none;
              padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
      Redefinir senha
    </a>
    <p style="margin:24px 0 0;color:#71717a;font-size:13px;line-height:1.6;">
      Este link expira em <strong>1 hora</strong>.<br />
      Se voce nao solicitou a redefinicao, ignore este email — sua senha nao sera alterada.
    </p>
    <p style="margin:16px 0 0;color:#a1a1aa;font-size:12px;word-break:break-all;">
      Ou copie e cole no navegador:<br />
      <a href="${resetUrl}" style="color:#09090b;">${resetUrl}</a>
    </p>
  `)
}

function welcomeHtml(name: string): string {
  return base(`
    <h1 style="margin:0 0 8px;color:#09090b;font-size:22px;font-weight:700;">Bem-vindo, ${name}!</h1>
    <p style="margin:0 0 16px;color:#52525b;font-size:15px;line-height:1.6;">
      Sua conta VATICI foi criada com sucesso. Voce ja pode comecar a negociar
      em mercados de previsao e lucrar com suas opinioes.
    </p>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">
      Voce recebeu <strong>R$10.000</strong> em creditos de demonstracao para comecar a explorar a plataforma.
    </p>
    <a href="${APP_URL}"
       style="display:inline-block;background:#09090b;color:#ffffff;text-decoration:none;
              padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;">
      Acessar plataforma
    </a>
    <p style="margin:24px 0 0;color:#71717a;font-size:13px;line-height:1.6;">
      Qualquer duvida, entre em contato pelo site.
    </p>
  `)
}
