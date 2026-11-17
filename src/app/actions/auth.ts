'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createFuncionarioSession, destroyFuncionarioSession } from '@/lib/auth/session'
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
