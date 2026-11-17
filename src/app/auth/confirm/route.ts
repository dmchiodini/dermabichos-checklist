import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { grantAdminRecovery } from '@/lib/auth/session'

const RESET_PAGE = '/admin/redefinir-senha'
const INVALID_LINK = '/admin/esqueci-senha?erro=link'

/** Só permite redirecionar para páginas internas do painel (evita open redirect). */
function safeNext(value: string | null): string {
  if (value && value.startsWith('/admin/') && !value.startsWith('//')) return value
  return RESET_PAGE
}

/**
 * Recebe o link do e-mail de recuperação de senha do Supabase.
 * Aceita os dois formatos:
 *  - `?code=...`                          (padrão do Supabase, fluxo PKCE no mesmo navegador)
 *  - `?token_hash=...&type=recovery`      (template de e-mail personalizado, funciona em qualquer aparelho)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNext(searchParams.get('next'))

  const supabase = await createClient()

  let userId: string | null = null

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) console.error('[auth/confirm] exchangeCodeForSession:', error.message)
    userId = data.user?.id ?? null
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) console.error('[auth/confirm] verifyOtp:', error.message)
    userId = data.user?.id ?? null
  }

  if (!userId) redirect(INVALID_LINK)

  if (next === RESET_PAGE) {
    await grantAdminRecovery(userId)
  }

  redirect(next)
}
