import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { SessionUser } from './permissions'

export const FUNCIONARIO_COOKIE = 'funcionario_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 1 semana

type SessionPayload = { id: string; exp: number }

export class AuthError extends Error {
  constructor(message = 'Sessão expirada. Faça login novamente.') {
    super(message)
    this.name = 'AuthError'
  }
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'Variável de ambiente SESSION_SECRET ausente ou curta demais (mínimo 32 caracteres). ' +
      'Gere uma com: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
    )
  }
  return secret
}

function sign(value: string): string {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url')
}

function encodeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

function decodeSession(token: string | undefined): SessionPayload | null {
  if (!token) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  const expected = Buffer.from(sign(body))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<SessionPayload>
    if (typeof payload.id !== 'string' || typeof payload.exp !== 'number') return null
    if (payload.exp < Date.now()) return null
    return { id: payload.id, exp: payload.exp }
  } catch {
    return null
  }
}

export async function createFuncionarioSession(funcionarioId: string) {
  const cookieStore = await cookies()
  cookieStore.set(FUNCIONARIO_COOKIE, encodeSession({ id: funcionarioId, exp: Date.now() + SESSION_MAX_AGE * 1000 }), {
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
