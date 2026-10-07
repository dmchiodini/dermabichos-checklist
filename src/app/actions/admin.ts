'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addFuncionario(formData: FormData) {
  const nome = formData.get('nome') as string
  const cargo = formData.get('cargo') as string
  const role = formData.get('role') as string
  const login = formData.get('login') as string
  const senha = formData.get('senha') as string
  const foto = formData.get('foto') as File | null

  if (!nome || !cargo || !role || !login || !senha) return { success: false, message: 'Preencha todos os campos obrigatórios' }

  const supabase = await createClient()

  let foto_url = null
  if (foto && foto.size > 0) {
    const fileExt = foto.name.split('.').pop()
    const fileName = `funcionarios/${crypto.randomUUID()}.${fileExt}`
    const arrayBuffer = await foto.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('checklists')
      .upload(fileName, buffer, { contentType: foto.type, upsert: false })

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('checklists').getPublicUrl(fileName)
      foto_url = publicUrlData.publicUrl
    }
  }

  const { error } = await supabase.from('funcionarios').insert({ nome, cargo, role, login, senha, ativo: true, foto_url })
  
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
  const foto = formData.get('foto') as File | null

  if (!id || !nome || !cargo || !role || !login) return { success: false, message: 'Preencha os campos obrigatórios' }

  const supabase = await createClient()
  
  const updateData: any = { nome, cargo, role, login }
  if (senha && senha.trim() !== '') {
    updateData.senha = senha
  }

  if (foto && foto.size > 0) {
    const fileExt = foto.name.split('.').pop()
    const fileName = `funcionarios/${crypto.randomUUID()}.${fileExt}`
    const arrayBuffer = await foto.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('checklists')
      .upload(fileName, buffer, { contentType: foto.type, upsert: false })

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from('checklists').getPublicUrl(fileName)
      updateData.foto_url = publicUrlData.publicUrl
    }
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

