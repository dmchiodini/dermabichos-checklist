'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthError, requireAdmin } from '@/lib/auth/session'
import { hashPassword } from '@/lib/auth/password'
import { isUploadableFile, removeFiles, uploadImage, UploadError } from '@/lib/storage'
import { formString, isUUID } from '@/lib/validation'
import type { Database } from '@/types/database.types'
import type { ActionResult } from './auth'

type FuncionarioUpdate = Database['public']['Tables']['funcionarios']['Update']

const ROLE_MAP: Record<string, string> = {
  'Recepção': 'recepcao',
  'Operacional': 'operacional',
  recepcao: 'recepcao',
  operacional: 'operacional',
}

/** Converte exceções conhecidas em mensagens amigáveis, sem vazar detalhes internos. */
function toErrorResult(error: unknown, fallback: string): ActionResult {
  if (error instanceof AuthError || error instanceof UploadError) {
    return { success: false, message: error.message }
  }
  console.error(fallback, error)
  return { success: false, message: fallback }
}

function revalidateFuncionarios() {
  revalidatePath('/admin/dashboard')
  revalidatePath('/')
}

function revalidateHidratacoes() {
  revalidatePath('/admin/dashboard')
  revalidatePath('/checklist')
  revalidatePath('/')
}

// ---------------------------------------------------------------------------
// Funcionários
// ---------------------------------------------------------------------------

export async function addFuncionario(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()

    const nome = formString(formData, 'nome')
    const cargo = formString(formData, 'cargo')
    const role = ROLE_MAP[formString(formData, 'role')]
    const login = formData.get('login')
    const senha = formData.get('senha')
    const foto = formData.get('foto')

    if (!nome || !cargo || !role || typeof login !== 'string' || !login || typeof senha !== 'string' || !senha) {
      return { success: false, message: 'Preencha todos os campos obrigatórios' }
    }

    const supabase = createAdminClient()

    let foto_url: string | null = null
    let uploadedPath: string | null = null
    if (isUploadableFile(foto)) {
      const uploaded = await uploadImage(supabase, 'funcionarios', foto)
      foto_url = uploaded.publicUrl
      uploadedPath = uploaded.path
    }

    const { error } = await supabase.from('funcionarios').insert({
      nome,
      cargo,
      role,
      login,
      senha: await hashPassword(senha),
      ativo: true,
      foto_url,
    })

    if (error) {
      if (uploadedPath) await removeFiles(supabase, [uploadedPath])
      if (error.code === '23505') return { success: false, message: 'Já existe um funcionário com esse login.' }
      console.error('[addFuncionario]', error)
      return { success: false, message: 'Erro ao cadastrar funcionário.' }
    }

    revalidateFuncionarios()
    return { success: true }
  } catch (error) {
    return toErrorResult(error, 'Erro ao cadastrar funcionário.')
  }
}

export async function toggleFuncionario(id: string, currentStatus: boolean): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!isUUID(id)) return { success: false, message: 'Funcionário inválido.' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('funcionarios').update({ ativo: !currentStatus }).eq('id', id)
    if (error) throw error

    revalidateFuncionarios()
    return { success: true }
  } catch (error) {
    return toErrorResult(error, 'Erro ao alterar status do funcionário.')
  }
}

export async function deleteFuncionario(id: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!isUUID(id)) return { success: false, message: 'Funcionário inválido.' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('funcionarios').delete().eq('id', id)
    if (error) {
      if (error.code === '23503') {
        return { success: false, message: 'Não é possível excluir: o usuário já possui checklists vinculados. Apenas desative-o.' }
      }
      throw error
    }

    revalidateFuncionarios()
    return { success: true }
  } catch (error) {
    return toErrorResult(error, 'Erro ao excluir funcionário.')
  }
}

export async function updateFuncionario(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()

    const id = formString(formData, 'id')
    const nome = formString(formData, 'nome')
    const cargo = formString(formData, 'cargo')
    const role = ROLE_MAP[formString(formData, 'role')]
    const login = formData.get('login')
    const senha = formData.get('senha')
    const foto = formData.get('foto')

    if (!isUUID(id) || !nome || !cargo || !role || typeof login !== 'string' || !login) {
      return { success: false, message: 'Preencha os campos obrigatórios' }
    }

    const supabase = createAdminClient()
    const updateData: FuncionarioUpdate = { nome, cargo, role, login }

    if (typeof senha === 'string' && senha.trim() !== '') {
      updateData.senha = await hashPassword(senha)
    }

    let uploadedPath: string | null = null
    if (isUploadableFile(foto)) {
      const uploaded = await uploadImage(supabase, 'funcionarios', foto)
      updateData.foto_url = uploaded.publicUrl
      uploadedPath = uploaded.path
    }

    const { error } = await supabase.from('funcionarios').update(updateData).eq('id', id)
    if (error) {
      if (uploadedPath) await removeFiles(supabase, [uploadedPath])
      if (error.code === '23505') return { success: false, message: 'Já existe um funcionário com esse login.' }
      console.error('[updateFuncionario]', error)
      return { success: false, message: 'Erro ao atualizar funcionário.' }
    }

    revalidateFuncionarios()
    return { success: true }
  } catch (error) {
    return toErrorResult(error, 'Erro ao atualizar funcionário.')
  }
}

// ---------------------------------------------------------------------------
// Tipos de hidratação
// ---------------------------------------------------------------------------

export async function addTipoHidratacao(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()

    const nome = formString(formData, 'nome')
    if (!nome) return { success: false, message: 'Preencha o nome' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('tipos_hidratacao').insert({ nome, ativo: true })
    if (error) throw error

    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    return toErrorResult(error, 'Erro ao cadastrar hidratação.')
  }
}

export async function toggleTipoHidratacao(id: string, currentStatus: boolean): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!isUUID(id)) return { success: false, message: 'Hidratação inválida.' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('tipos_hidratacao').update({ ativo: !currentStatus }).eq('id', id)
    if (error) throw error

    revalidateHidratacoes()
    return { success: true }
  } catch (error) {
    return toErrorResult(error, 'Erro ao alterar status da hidratação.')
  }
}

export async function updateTipoHidratacao(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()

    const id = formString(formData, 'id')
    const nome = formString(formData, 'nome')
    if (!isUUID(id) || !nome) {
      return { success: false, message: 'O nome da hidratação é obrigatório' }
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from('tipos_hidratacao').update({ nome }).eq('id', id)
    if (error) throw error

    revalidateHidratacoes()
    return { success: true }
  } catch (error) {
    return toErrorResult(error, 'Erro ao atualizar hidratação.')
  }
}

export async function deleteTipoHidratacao(id: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!isUUID(id)) return { success: false, message: 'Hidratação inválida.' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('tipos_hidratacao').delete().eq('id', id)
    if (error) {
      if (error.code === '23503') {
        return { success: false, message: 'Não é possível excluir hidratação que já foi usada em um checklist.' }
      }
      throw error
    }

    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    return toErrorResult(error, 'Erro ao excluir hidratação.')
  }
}

// ---------------------------------------------------------------------------
// Checklists
// ---------------------------------------------------------------------------

export async function deleteChecklist(id: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!isUUID(id)) return { success: false, message: 'Checklist inválido.' }

    const supabase = createAdminClient()
    const { error } = await supabase.from('checklists').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    return toErrorResult(error, 'Erro ao excluir checklist.')
  }
}
