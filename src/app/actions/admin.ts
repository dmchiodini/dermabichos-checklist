'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addFuncionario(formData: FormData) {
  const nome = formData.get('nome') as string
  const cargo = formData.get('cargo') as string
  const role = formData.get('role') as string
  const login = formData.get('login') as string
  const senha = formData.get('senha') as string

  if (!nome || !cargo || !role || !login || !senha) return { success: false, message: 'Preencha todos os campos' }

  const supabase = await createClient()
  const { error } = await supabase.from('funcionarios').insert({ nome, cargo, role, login, senha, ativo: true })
  
  if (error) return { success: false, message: error.message }
  
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function toggleFuncionario(id: string, currentStatus: boolean) {
  const supabase = await createClient()
  await supabase.from('funcionarios').update({ ativo: !currentStatus }).eq('id', id)
  revalidatePath('/admin/dashboard')
}

export async function deleteFuncionario(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('funcionarios').delete().eq('id', id)
  if (error) {
    if (error.code === '23503') { // foreign key violation
      return { success: false, message: 'Não é possível excluir: o usuário já possui checklists vinculados. Apenas desative-o.' }
    }
    return { success: false, message: error.message }
  }
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updateFuncionario(formData: FormData) {
  const id = formData.get('id') as string
  const nome = formData.get('nome') as string
  const cargo = formData.get('cargo') as string
  const role = formData.get('role') as string
  const login = formData.get('login') as string
  const senha = formData.get('senha') as string

  if (!id || !nome || !cargo || !role || !login) return { success: false, message: 'Preencha os campos obrigatórios' }

  const supabase = await createClient()
  
  const updateData: any = { nome, cargo, role, login }
  if (senha && senha.trim() !== '') {
    updateData.senha = senha
  }

  const { error } = await supabase.from('funcionarios').update(updateData).eq('id', id)
  
  if (error) return { success: false, message: error.message }
  
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function addTipoHidratacao(formData: FormData) {
  const nome = formData.get('nome') as string

  if (!nome) return { success: false, message: 'Preencha o nome' }

  const supabase = await createClient()
  const { error } = await supabase.from('tipos_hidratacao').insert({ nome, ativo: true })
  
  if (error) return { success: false, message: error.message }
  
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function toggleTipoHidratacao(id: string, currentStatus: boolean) {
  const supabase = await createClient()
  await supabase.from('tipos_hidratacao').update({ ativo: !currentStatus }).eq('id', id)
  revalidatePath('/admin/dashboard')
}

export async function deleteChecklist(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('checklists').delete().eq('id', id)
  if (error) return { success: false, message: error.message }
  
  revalidatePath('/admin/dashboard')
  return { success: true }
}

