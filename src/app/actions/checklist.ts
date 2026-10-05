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
    let assinatura_url = null
    if (data.assinatura) {
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
    // Como os enums detalhados vem do Zod form values
    const insertData = {
      pet_nome: data.pet_nome,
      especie: data.especie,
      raca: data.raca,
      tutor: data.tutor,
      detalhes: {
        laco: data.detalhes.laco,
        brilho: data.detalhes.brilho,
        perfume: data.detalhes.perfume,
        escova_dente: data.detalhes.escova_dente,
        outros: data.detalhes.outros || ''
      },
      tosa: {
        higienica: data.tosa.higienica,
        maquina: data.tosa.maquina,
        tesoura: data.tosa.tesoura
      },
      hidratacao: {
        padrao: data.hidratacao.padrao,
        hipoalergenico: data.hidratacao.hipoalergenico,
        qual: data.hidratacao.qual || ''
      },
      observacao: data.observacao || null,
      realizado_por_id: data.realizado_por_id,
      vistoriado_por_id: data.vistoriado_por_id,
      termo_aceito: data.termo_aceito,
      assinatura_url: assinatura_url,
      foto_1_url: fotoUrls[0] || null,
      foto_2_url: fotoUrls[1] || null
    }

    const { error: dbError } = await supabase
      .from('checklists')
      .insert(insertData)

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
