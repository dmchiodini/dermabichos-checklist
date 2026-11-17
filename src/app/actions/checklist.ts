'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthError, requireFuncionario } from '@/lib/auth/session'
import {
  canAccessChecklist,
  isChecklistStatus,
  isRecepcao,
  STATUS_EXCLUIDO,
  type SessionUser,
} from '@/lib/auth/permissions'
import { isSignatureDataUrl, isUploadableFile, removeFiles, uploadImage, uploadSignature, UploadError } from '@/lib/storage'
import { endOfLocalDay, isISODate, startOfLocalDay, todayLocalISODate } from '@/lib/dates'
import { buildPetTutorSearchFilter, isUUID } from '@/lib/validation'
import { checklistSchema, type ChecklistFormValues } from '@/schemas/checklist.schema'
import type { ChecklistRow, ChecklistUpdate, FuncionarioPublico } from '@/types/database.types'
import type { ActionResult } from './auth'

const MAX_FOTOS = 2
const MAX_MOTIVO_LENGTH = 1000
const STATUS_FINALIZADO = 'Finalizado'

function toErrorResult(error: unknown, fallback: string): ActionResult {
  if (error instanceof AuthError || error instanceof UploadError) {
    return { success: false, message: error.message }
  }
  console.error(fallback, error)
  return { success: false, message: fallback }
}

type ChecklistAccessRow = Pick<ChecklistRow, 'id' | 'status' | 'realizado_por_id' | 'detalhes' | 'foto_1_url' | 'foto_2_url'>

/** Carrega o checklist e confere se o funcionário pode acessá-lo. */
async function loadAccessibleChecklist(user: SessionUser, id: string): Promise<ChecklistAccessRow | null> {
  if (!isUUID(id)) return null
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('checklists')
    .select('id, status, realizado_por_id, detalhes, foto_1_url, foto_2_url')
    .eq('id', id)
    .maybeSingle()

  if (!data || data.status === STATUS_EXCLUIDO || !canAccessChecklist(user, data)) return null
  return data
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

export async function getLookupData(): Promise<{
  funcionarios: FuncionarioPublico[]
  hidratacoes: { id: string; nome: string }[]
}> {
  await requireFuncionario()
  const supabase = createAdminClient()

  const [{ data: funcionarios }, { data: hidratacoes }] = await Promise.all([
    supabase.from('funcionarios').select('id, nome, cargo').eq('ativo', true).order('nome'),
    supabase.from('tipos_hidratacao').select('id, nome').eq('ativo', true).order('nome'),
  ])

  return {
    funcionarios: funcionarios ?? [],
    hidratacoes: hidratacoes ?? [],
  }
}

/** Checklist completo para a tela de edição/visualização do tablet. */
export async function getChecklistForEdit(id: string): Promise<ChecklistRow | null> {
  const user = await requireFuncionario()
  if (!isUUID(id)) return null

  const supabase = createAdminClient()
  const { data } = await supabase.from('checklists').select('*').eq('id', id).maybeSingle()
  if (!data || !canAccessChecklist(user, data)) return null
  return data
}

async function listChecklists(user: SessionUser, dateFilter?: string, searchFilter?: string): Promise<ChecklistRow[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('checklists')
    .select('*')
    .neq('status', STATUS_EXCLUIDO)
    .order('created_at', { ascending: false })

  if (dateFilter && isISODate(dateFilter)) {
    query = query
      .gte('created_at', startOfLocalDay(dateFilter).toISOString())
      .lte('created_at', endOfLocalDay(dateFilter).toISOString())
  } else {
    // Sem data: a partir de hoje
    query = query.gte('created_at', startOfLocalDay(todayLocalISODate()).toISOString())
  }

  if (searchFilter) {
    const orFilter = buildPetTutorSearchFilter(searchFilter)
    if (orFilter) query = query.or(orFilter)
  }

  // Operacional só vê os checklists que ele mesmo realiza
  if (!isRecepcao(user)) {
    query = query.eq('realizado_por_id', user.id)
  }

  const { data, error } = await query
  if (error) {
    console.error('Erro ao buscar checklists:', error)
    return []
  }
  return data
}

export async function getActiveChecklists(): Promise<ChecklistRow[]> {
  const user = await requireFuncionario()
  return listChecklists(user)
}

export async function getFilteredChecklists(dateFilter?: string, searchFilter?: string): Promise<ChecklistRow[]> {
  const user = await requireFuncionario()
  return listChecklists(user, dateFilter, searchFilter)
}

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

export async function submitChecklist(input: ChecklistFormValues, fotosFormData: FormData): Promise<ActionResult> {
  const supabase = createAdminClient()
  const uploadedPaths: string[] = []

  try {
    const user = await requireFuncionario()
    const recepcao = isRecepcao(user)

    const parsed = checklistSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? 'Dados do checklist inválidos.' }
    }
    const data = parsed.data

    let existing: ChecklistAccessRow | null = null
    if (data.id) {
      existing = await loadAccessibleChecklist(user, data.id)
      if (!existing) return { success: false, message: 'Checklist não encontrado.' }
      if (existing.status === STATUS_FINALIZADO) {
        return { success: false, message: 'Este checklist já foi concluído e não pode mais ser alterado.' }
      }
    } else if (!recepcao) {
      return { success: false, message: 'Apenas a recepção pode iniciar um checklist.' }
    }

    // 1. Fotos: mantém as já existentes que o usuário não removeu + novas (máximo 2)
    const fotosAtuais = existing ? [existing.foto_1_url, existing.foto_2_url].filter((url): url is string => !!url) : []
    const mantidasSolicitadas = new Set(fotosFormData.getAll('fotosMantidas').filter((v): v is string => typeof v === 'string'))
    const fotosMantidas = fotosAtuais.filter((url) => mantidasSolicitadas.has(url))
    const fotosNovas = fotosFormData.getAll('fotos').filter(isUploadableFile).slice(0, Math.max(0, MAX_FOTOS - fotosMantidas.length))

    const fotoUrls = [...fotosMantidas]
    for (const foto of fotosNovas) {
      const uploaded = await uploadImage(supabase, 'fotos', foto)
      uploadedPaths.push(uploaded.path)
      fotoUrls.push(uploaded.publicUrl)
    }

    const fotosPayload = {
      foto_1_url: fotoUrls[0] ?? null,
      foto_2_url: fotoUrls[1] ?? null,
    }

    const cuidadosMedicos = Boolean(data.cuidados_medicos)

    if (!recepcao) {
      // Operacional: só pode alterar observações, alerta de saúde e fotos (mesmos campos liberados na tela).
      const detalhesAtuais = existing?.detalhes && typeof existing.detalhes === 'object' ? existing.detalhes : null
      const payload: ChecklistUpdate = {
        observacao: data.observacao || null,
        ...fotosPayload,
      }
      if (detalhesAtuais) payload.detalhes = { ...detalhesAtuais, cuidados_medicos: cuidadosMedicos }

      const { error } = await supabase.from('checklists').update(payload).eq('id', existing!.id)
      if (error) throw error
      return { success: true }
    }

    // 2. Assinatura (somente recepção)
    let assinatura_url: string | undefined
    if (isSignatureDataUrl(data.assinatura)) {
      const uploaded = await uploadSignature(supabase, data.assinatura)
      uploadedPaths.push(uploaded.path)
      assinatura_url = uploaded.publicUrl
    }

    // 3. Banco de dados
    const payload = {
      pet_nome: data.pet_nome,
      especie: data.especie,
      raca: data.raca,
      tutor: data.tutor,
      detalhes: {
        laco: data.detalhes?.laco || false,
        brilho: data.detalhes?.brilho || false,
        perfume: data.detalhes?.perfume || false,
        escova_dente: data.detalhes?.escova_dente || false,
        outros: data.detalhes?.outros || '',
        observacao_cuidados: data.observacao_cuidados || data.detalhes?.observacao_cuidados || '',
        cuidados_medicos: cuidadosMedicos,
      },
      tosa: {
        higienica: data.tosa?.higienica || false,
        maquina: data.tosa?.maquina || false,
        tesoura: data.tosa?.tesoura || false,
      },
      hidratacao: {
        padrao: data.hidratacao?.padrao || false,
        hipoalergenico: data.hidratacao?.hipoalergenico || false,
        qual: data.hidratacao?.qual || '',
        shampoo_terapeutico: Boolean(data.hidratacao?.shampoo_terapeutico),
      },
      observacao: data.observacao || null,
      realizado_por_id: isUUID(data.realizado_por_id) ? data.realizado_por_id : null,
      vistoriado_por_id: isUUID(data.vistoriado_por_id) ? data.vistoriado_por_id : null,
      termo_aceito: data.termo_aceito || false,
      ...fotosPayload,
      ...(assinatura_url ? { assinatura_url } : {}),
    }

    const { error } = existing
      ? await supabase.from('checklists').update(payload).eq('id', existing.id)
      : await supabase.from('checklists').insert({ ...payload, status: 'Aguardando' })

    if (error) throw error

    return { success: true }
  } catch (error) {
    // Limpeza de arquivos caso algo falhe depois do upload
    await removeFiles(supabase, uploadedPaths)
    return toErrorResult(error, 'Falha ao salvar o checklist no banco de dados')
  }
}

export async function updateChecklistStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const user = await requireFuncionario()

    if (!isChecklistStatus(status)) return { success: false, message: 'Status inválido.' }
    if (status === STATUS_FINALIZADO && !isRecepcao(user)) {
      return { success: false, message: 'Apenas a recepção pode finalizar o atendimento.' }
    }

    const checklist = await loadAccessibleChecklist(user, id)
    if (!checklist) return { success: false, message: 'Checklist não encontrado.' }
    if (checklist.status === STATUS_FINALIZADO) {
      return { success: false, message: 'Este checklist já foi concluído e não pode mais ser alterado.' }
    }

    const supabase = createAdminClient()
    const { error } = await supabase.from('checklists').update({ status }).eq('id', checklist.id)
    if (error) throw error

    return { success: true }
  } catch (error) {
    return toErrorResult(error, 'Erro ao atualizar status')
  }
}

export async function softDeleteChecklist(id: string, motivo: string): Promise<ActionResult> {
  try {
    const user = await requireFuncionario()
    if (!isRecepcao(user)) {
      return { success: false, message: 'Apenas a recepção pode excluir checklists.' }
    }

    const motivoLimpo = typeof motivo === 'string' ? motivo.trim() : ''
    if (!motivoLimpo) {
      return { success: false, message: 'O motivo da exclusão é obrigatório.' }
    }
    if (motivoLimpo.length > MAX_MOTIVO_LENGTH) {
      return { success: false, message: `O motivo deve ter no máximo ${MAX_MOTIVO_LENGTH} caracteres.` }
    }

    const checklist = await loadAccessibleChecklist(user, id)
    if (!checklist) return { success: false, message: 'Checklist não encontrado.' }

    // Preserva as demais informações de "detalhes"
    const detalhesAtuais = checklist.detalhes && typeof checklist.detalhes === 'object' ? checklist.detalhes : {}

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('checklists')
      .update({
        status: STATUS_EXCLUIDO,
        detalhes: {
          ...detalhesAtuais,
          motivo_exclusao: motivoLimpo,
          excluido_em: new Date().toISOString(),
        },
      })
      .eq('id', checklist.id)

    if (error) throw error

    revalidatePath('/')
    revalidatePath('/checklist')
    revalidatePath('/admin/dashboard')

    return { success: true }
  } catch (error) {
    return toErrorResult(error, 'Erro ao excluir checklist')
  }
}
