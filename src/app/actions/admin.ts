'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addFuncionario(formData: FormData) {
  const nome = formData.get('nome') as string
  const cargo = formData.get('cargo') as string

  if (!nome || !cargo) return { success: false, message: 'Preencha todos os campos' }

  const supabase = await createClient()
  const { error } = await supabase.from('funcionarios').insert({ nome, cargo, ativo: true })
  
  if (error) return { success: false, message: error.message }
  
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function toggleFuncionario(id: string, currentStatus: boolean) {
  const supabase = await createClient()
  await supabase.from('funcionarios').update({ ativo: !currentStatus }).eq('id', id)
  revalidatePath('/admin/dashboard')
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

