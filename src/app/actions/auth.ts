'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'
import {
  AuthError,
  clearAdminRecovery,
  createFuncionarioSession,
  destroyFuncionarioSession,
  hasAdminRecovery,
  requireAdmin,
} from '@/lib/auth/session'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { formString } from '@/lib/validation'

export type ActionResult = { success: boolean; message?: string }

export async function login(formData: FormData): Promise<ActionResult> {
  const email = formString(formData, 'email')
  const password = formData.get('password')

  if (!email || typeof password !== 'string' || !password) {
    return { success: false, message: 'E-mail ou senha incorretos' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[login]', error.status, error.code, error.message)
    return { success: false, message: 'E-mail ou senha incorretos' }
  }

  redirect('/admin/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

const LOGIN_FUNCIONARIO_ERRO = 'Usuário ou senha incorretos (ou inativo)'

export async function loginFuncionario(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  // Login sem trim: preserva exatamente o que foi cadastrado.
  const login = formData.get('login')
  const senha = formData.get('senha')

  if (typeof login !== 'string' || !login || typeof senha !== 'string' || !senha) {
    return { success: false, message: LOGIN_FUNCIONARIO_ERRO }
  }

  const supabase = createAdminClient()
  const { data: candidatos, error } = await supabase
    .from('funcionarios')
    .select('id, senha')
    .eq('login', login)
    .eq('ativo', true)

  if (error) {
    console.error('[loginFuncionario]', error)
    return { success: false, message: LOGIN_FUNCIONARIO_ERRO }
  }

  let funcionarioId: string | null = null
  for (const candidato of candidatos ?? []) {
    const { valid, needsRehash } = await verifyPassword(senha, candidato.senha)
    if (!valid) continue

    funcionarioId = candidato.id
    if (needsRehash) {
      // Migração transparente: senhas antigas em texto puro passam a ser gravadas com hash.
      const { error: rehashError } = await supabase
        .from('funcionarios')
        .update({ senha: await hashPassword(senha) })
        .eq('id', candidato.id)
      if (rehashError) console.error('[loginFuncionario] falha ao migrar hash da senha:', rehashError)
    }
    break
  }

  if (!funcionarioId) {
    return { success: false, message: LOGIN_FUNCIONARIO_ERRO }
  }

  await createFuncionarioSession(funcionarioId)
  redirect('/')
}

export async function logoutFuncionario() {
  await destroyFuncionarioSession()
  redirect('/login')
}

// ---------------------------------------------------------------------------
// Senha do administrador (Supabase Auth)
// ---------------------------------------------------------------------------

const MIN_ADMIN_PASSWORD = 8
const RESET_EMAIL_SENT =
  'Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha em instantes. Verifique também a caixa de spam.'

async function getRequestOrigin(): Promise<string> {
  const h = await headers()
  const origin = h.get('origin')
  if (origin) return origin
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

/** Envia o e-mail de recuperação. A resposta é sempre a mesma, para não revelar quais e-mails existem. */
export async function requestAdminPasswordReset(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const email = formString(formData, 'email')
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Informe um e-mail válido.' }
  }

  const origin = await getRequestOrigin()
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/admin/redefinir-senha`,
  })

  if (error) {
    console.error('[requestAdminPasswordReset]', error.status, error.code, error.message)
    if (error.status === 429) {
      return { success: false, message: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.' }
    }
  }

  return { success: true, message: RESET_EMAIL_SENT }
}

/**
 * Define a nova senha do admin logado.
 * - Vindo do link de recuperação: não pede a senha atual.
 * - Troca normal (admin logado): exige a senha atual.
 */
export async function updateAdminPassword(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireAdmin()

    const senhaAtual = formData.get('senhaAtual')
    const novaSenha = formData.get('novaSenha')
    const confirmacao = formData.get('confirmacao')

    if (typeof novaSenha !== 'string' || novaSenha.length < MIN_ADMIN_PASSWORD) {
      return { success: false, message: `A nova senha deve ter pelo menos ${MIN_ADMIN_PASSWORD} caracteres.` }
    }
    if (novaSenha !== confirmacao) {
      return { success: false, message: 'A confirmação não confere com a nova senha.' }
    }

    const viaRecuperacao = await hasAdminRecovery(user.id)
    if (!viaRecuperacao) {
      if (typeof senhaAtual !== 'string' || !senhaAtual || !user.email) {
        return { success: false, message: 'Informe a senha atual.' }
      }
      // Confere a senha atual com um cliente isolado (não mexe nos cookies da sessão)
      const verifier = createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { error: verifyError } = await verifier.auth.signInWithPassword({ email: user.email, password: senhaAtual })
      if (verifyError) {
        return { success: false, message: 'A senha atual está incorreta.' }
      }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) {
      console.error('[updateAdminPassword]', error.status, error.code, error.message)
      if (error.code === 'same_password') {
        return { success: false, message: 'A nova senha precisa ser diferente da atual.' }
      }
      if (error.code === 'weak_password') {
        return { success: false, message: 'Senha fraca demais. Use letras, números e símbolos.' }
      }
      return { success: false, message: 'Não foi possível alterar a senha. Tente novamente.' }
    }

    await clearAdminRecovery()
    return { success: true, message: 'Senha alterada com sucesso!' }
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, message: 'Sua sessão expirou. Solicite um novo link de recuperação.' }
    }
    console.error('[updateAdminPassword]', error)
    return { success: false, message: 'Não foi possível alterar a senha. Tente novamente.' }
  }
}
