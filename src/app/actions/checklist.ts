'use server'

import { createClient } from '@/lib/supabase/server'
import { ChecklistFormValues } from '@/schemas/checklist.schema'

export async function getLookupData() {
  const supabase = await createClient()
  const { data: funcionarios } = await supabase.from('funcionarios').select('*').eq('ativo', true).order('nome')
  const { data: hidratacoes } = await supabase.from('tipos_hidratacao').select('*').eq('ativo', true).order('nome')

  return { 
    funcionarios: funcionarios || [], 
    hidratacoes: hidratacoes || [] 
  }
}

export async function submitChecklist(data: ChecklistFormValues, fotosFormData: FormData) {
  try {
    const supabase = await createClient()
    const filesToCleanup: string[] = []

    // 1. Upload Assinatura (Base64 -> Buffer -> Supabase Storage)
    // 1. Upload Assinatura (Base64 -> Buffer -> Supabase Storage)
    let assinatura_url = null
    if (data.assinatura && data.assinatura.startsWith('data:image')) {
      // Remover o prefixo data:image/png;base64,
      const base64Data = data.assinatura.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const fileName = `assinaturas/${crypto.randomUUID()}.png`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('checklists')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false
        })

      if (uploadError) {
        console.error('Erro no upload da assinatura:', uploadError)
        throw new Error('Falha ao enviar assinatura')
      }

      const { data: publicUrlData } = supabase.storage
        .from('checklists')
        .getPublicUrl(fileName)
        
      assinatura_url = publicUrlData.publicUrl
      filesToCleanup.push(fileName)
    }

    // 2. Upload Fotos (File -> ArrayBuffer -> Supabase Storage)
    const fotos = fotosFormData.getAll('fotos') as File[]
    const fotoUrls: string[] = []

    for (let i = 0; i < fotos.length; i++) {
      const file = fotos[i]
      if (file.size > 0) {
        const fileExt = file.name.split('.').pop()
        const fileName = `fotos/${crypto.randomUUID()}.${fileExt}`
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('checklists')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false
          })

        if (uploadError) {
          console.error(`Erro no upload da foto ${i}:`, uploadError)
          continue // Pode optar por throw Error se for obrigatório
        }

        const { data: publicUrlData } = supabase.storage
          .from('checklists')
          .getPublicUrl(fileName)

        fotoUrls.push(publicUrlData.publicUrl)
        filesToCleanup.push(fileName)
      }
    }

    // 3. Salvar no Banco de Dados

    const payload: any = {
      pet_nome: data.pet_nome,
      especie: data.especie,
      raca: data.raca,
      tutor: data.tutor,
      detalhes: {
        laco: data.detalhes?.laco || false,
        brilho: data.detalhes?.brilho || false,
        perfume: data.detalhes?.perfume || false,
        escova_dente: data.detalhes?.escova_dente || false,
        outros: data.detalhes?.outros || ''
      },
      tosa: {
        higienica: data.tosa?.higienica || false,
        maquina: data.tosa?.maquina || false,
        tesoura: data.tosa?.tesoura || false
      },
      hidratacao: {
        padrao: data.hidratacao?.padrao || false,
        hipoalergenico: data.hidratacao?.hipoalergenico || false,
        qual: data.hidratacao?.qual || ''
      },
      observacao: data.observacao || null,
      realizado_por_id: data.realizado_por_id || null,
      vistoriado_por_id: data.vistoriado_por_id || null,
      termo_aceito: data.termo_aceito || false,
    }

    if (assinatura_url) payload.assinatura_url = assinatura_url
    if (fotoUrls[0]) payload.foto_1_url = fotoUrls[0]
    if (fotoUrls[1]) payload.foto_2_url = fotoUrls[1]

    let dbError = null

    if (data.id) {
      const { error } = await supabase
        .from('checklists')
        .update(payload)
        .eq('id', data.id)
      dbError = error
    } else {
      payload.status = 'Aguardando'
      const { error } = await supabase
        .from('checklists')
        .insert(payload)
      dbError = error
    }

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError)
      // Limpeza de arquivos caso o banco falhe
      if (filesToCleanup.length > 0) {
        await supabase.storage.from('checklists').remove(filesToCleanup)
      }
      throw new Error('Falha ao salvar o checklist no banco de dados')
    }

    return { success: true }
  } catch (error: any) {
    console.error('Erro na submissão do checklist:', error)
    return { success: false, message: error.message || 'Erro interno no servidor' }
  }
}

export async function updateChecklistStatus(id: string, status: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('checklists')
      .update({ status })
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('Erro ao atualizar status:', error)
    return { success: false, message: error.message }
  }
}

export async function getActiveChecklists(funcionario?: { id: string, cargo: string, role?: string }) {
  const supabase = await createClient()

  const today = new Date()
  const localDateStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
  const [year, month, day] = localDateStr.split('-').map(Number)
  const startDate = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString()
  
  let query = supabase
    .from('checklists')
    .select('*')
    .gte('created_at', startDate)
    .order('created_at', { ascending: false })
    
  // Se for operacional (não é recepção nem admin), só vê os próprios
  if (funcionario && funcionario.role !== 'recepcao' && funcionario.cargo?.toLowerCase() !== 'recepção' && funcionario.cargo?.toLowerCase() !== 'recepcao') {
    query = query.eq('realizado_por_id', funcionario.id)
  }
    
  const { data, error } = await query
    
  if (error) {
    console.error('Erro ao buscar checklists ativos:', error)
    return []
  }
  return data
}

export async function getFilteredChecklists(
  funcionario?: { id: string, cargo: string, role?: string },
  dateFilter?: string,
  searchFilter?: string
) {
  const supabase = await createClient()

  let query = supabase
    .from('checklists')
    .select('*')
    .order('created_at', { ascending: false })

  if (dateFilter) {
    // Se tem data, pega do inicio do dia ate o final
    const [year, month, day] = dateFilter.split('-').map(Number)
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString()
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString()
    query = query.gte('created_at', startDate).lte('created_at', endDate)
  } else {
    // Se não tem data (ex: inicializou), pega de hoje
    const today = new Date()
    const localDateStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
    const [year, month, day] = localDateStr.split('-').map(Number)
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString()
    query = query.gte('created_at', startDate)
  }

  if (searchFilter) {
    query = query.or(`pet_nome.ilike.%${searchFilter}%,tutor.ilike.%${searchFilter}%`)
  }

  if (funcionario && funcionario.role !== 'recepcao' && funcionario.cargo?.toLowerCase() !== 'recepção' && funcionario.cargo?.toLowerCase() !== 'recepcao') {
    query = query.eq('realizado_por_id', funcionario.id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao filtrar checklists:', error)
    return []
  }
  return data
}
