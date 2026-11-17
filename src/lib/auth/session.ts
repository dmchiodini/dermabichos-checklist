import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { SessionUser } from './permissions'
import { decodeSignedToken, encodeSignedToken } from './signed-token'

export const FUNCIONARIO_COOKIE = 'funcionario_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 1 semana

type SessionPayload = { id: string; exp: number }

export class AuthError extends Error {
  constructor(message = 'Sessão expirada. Faça login novamente.') {
    super(message)
    this.name = 'AuthError'
  }
}

function decodeSession(token: string | undefined): SessionPayload | null {
  const payload = decodeSignedToken<Partial<SessionPayload>>(token)
  if (!payload || typeof payload.id !== 'string') return null
  return { id: payload.id, exp: payload.exp }
}

export async function createFuncionarioSession(funcionarioId: string) {
  const cookieStore = await cookies()
  cookieStore.set(FUNCIONARIO_COOKIE, encodeSignedToken({ id: funcionarioId }, SESSION_MAX_AGE), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function destroyFuncionarioSession() {
  const cookieStore = await cookies()
  cookieStore.delete(FUNCIONARIO_COOKIE)
}

/**
 * Retorna o funcionário logado no tablet, sempre relido do banco
 * (assim, desativar um funcionário ou mudar o nível de acesso vale na hora).
 */
export const getFuncionario = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies()
  const session = decodeSession(cookieStore.get(FUNCIONARIO_COOKIE)?.value)
  if (!session) return null

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('funcionarios')
    .select('id, nome, cargo, role, foto_url, ativo')
    .eq('id', session.id)
    .maybeSingle()

  if (!data || !data.ativo) return null

  return {
    id: data.id,
    nome: data.nome,
    cargo: data.cargo,
    role: data.role || 'operacional',
    foto_url: data.foto_url ?? null,
  }
})

/** Para Server Actions: lança AuthError se não houver sessão válida. */
export async function requireFuncionario(): Promise<SessionUser> {
  const user = await getFuncionario()
  if (!user) throw new AuthError()
  return user
}

/** Para páginas do tablet: redireciona para o login se não houver sessão válida. */
export async function requireFuncionarioPage(): Promise<SessionUser> {
  const user = await getFuncionario()
  if (!user) redirect('/login')
  return user
}

/** Usuário do painel administrativo (Supabase Auth), validado no servidor do Supabase. */
export const getAdminUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
})

export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser()
  if (!user) throw new AuthError('Acesso restrito ao painel administrativo.')
  return user
}

export async function requireAdminPage(): Promise<User> {
  const user = await getAdminUser()
  if (!user) redirect('/admin/login')
  return user
}

// ---------------------------------------------------------------------------
// Recuperação de senha do admin
// ---------------------------------------------------------------------------

const ADMIN_RECOVERY_COOKIE = 'admin_recovery'
const ADMIN_RECOVERY_MAX_AGE = 60 * 15 // 15 minutos para definir a nova senha

/** Marca que o admin entrou pelo link de recuperação (dispensa a senha atual). */
export async function grantAdminRecovery(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_RECOVERY_COOKIE, encodeSignedToken({ uid: userId }, ADMIN_RECOVERY_MAX_AGE), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: ADMIN_RECOVERY_MAX_AGE,
  })
}

export async function hasAdminRecovery(userId: string): Promise<boolean> {
  const cookieStore = await cookies()
  const payload = decodeSignedToken<{ uid?: string }>(cookieStore.get(ADMIN_RECOVERY_COOKIE)?.value)
  return payload?.uid === userId
}

export async function clearAdminRecovery() {
  const cookieStore = await cookies()
  cookieStore.delete({ name: ADMIN_RECOVERY_COOKIE, path: '/admin' })
}
