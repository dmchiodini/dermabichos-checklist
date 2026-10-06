'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[login]', error.status, error.code, error.message)
    return { success: false, message: 'E-mail ou senha incorretos' }
  }

  // Redireciona em caso de sucesso
  redirect('/admin/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function loginFuncionario(prevState: any, formData: FormData) {
  const loginField = formData.get('login') as string
  const senhaField = formData.get('senha') as string

  const supabase = await createClient()
  const { data: func } = await supabase.from('funcionarios').select('*').eq('login', loginField).eq('senha', senhaField).eq('ativo', true).single()

  if (!func) {
    return { success: false, message: 'Usuário ou senha incorretos (ou inativo)' }
  }

  // Set secure cookie using next/headers
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  cookieStore.set('funcionario_session', JSON.stringify({
    id: func.id,
    nome: func.nome,
    cargo: func.cargo,
    role: func.role || 'operacional',
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  })

  redirect('/')
}

export async function logoutFuncionario() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  cookieStore.delete('funcionario_session')
  redirect('/login')
}
