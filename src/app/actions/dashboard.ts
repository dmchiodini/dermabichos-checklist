'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/session'
import { isISODate } from '@/lib/dates'

export type DashboardStats = {
  total: number
  finalizados: number
  abertos: number
  canina: number
  felina: number
  porFuncionario: { nome: string; finalizados: number }[]
  volumeDiario: { dia: string; total: number }[]
}

const EMPTY_STATS: DashboardStats = { total: 0, finalizados: 0, abertos: 0, canina: 0, felina: 0, porFuncionario: [], volumeDiario: [] }
const MAX_RANGE_DAYS = 366

export async function getDashboardStats(startDate: string, endDate: string): Promise<DashboardStats> {
  await requireAdmin()

  if (!isISODate(startDate) || !isISODate(endDate) || startDate > endDate) {
    return EMPTY_STATS
  }

  const supabase = createAdminClient()

  const [{ data: checklists, error }, { data: funcionarios }] = await Promise.all([
    supabase
      .from('checklists')
      .select('status, especie, realizado_por_id, created_at')
      .gte('created_at', `${startDate}T00:00:00.000Z`)
      .lte('created_at', `${endDate}T23:59:59.999Z`),
    supabase.from('funcionarios').select('id, nome').eq('role', 'operacional'),
  ])

  if (error || !checklists) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return EMPTY_STATS
  }

  const stats: DashboardStats = { ...EMPTY_STATS, porFuncionario: [], volumeDiario: [] }

  const funcMap: Record<string, { nome: string; finalizados: number }> = {}
  funcionarios?.forEach((f) => {
    funcMap[f.id] = { nome: f.nome, finalizados: 0 }
  })

  const volumeMap: Record<string, number> = {}

  for (const c of checklists) {
    if (c.status === 'Excluido') continue

    if (c.status === 'Finalizado') {
      stats.finalizados++
      if (c.realizado_por_id && funcMap[c.realizado_por_id]) {
        funcMap[c.realizado_por_id].finalizados++
      }
    } else {
      stats.abertos++
    }

    if (c.especie === 'Canina') stats.canina++
    if (c.especie === 'Felina') stats.felina++

    const dateStr = new Date(c.created_at).toISOString().split('T')[0]
    volumeMap[dateStr] = (volumeMap[dateStr] || 0) + 1
  }

  stats.total = stats.finalizados + stats.abertos
  stats.porFuncionario = Object.values(funcMap).sort((a, b) => b.finalizados - a.finalizados)

  // Gera todas as datas do período para incluir os dias com 0
  const current = new Date(startDate)
  const end = new Date(endDate)
  current.setUTCHours(12, 0, 0, 0) // evita deslocamento de fuso
  end.setUTCHours(12, 0, 0, 0)

  let guard = 0
  while (current <= end && guard++ <= MAX_RANGE_DAYS) {
    const dateStr = current.toISOString().split('T')[0]
    stats.volumeDiario.push({
      dia: dateStr.split('-').reverse().slice(0, 2).join('/'), // DD/MM
      total: volumeMap[dateStr] || 0,
    })
    current.setDate(current.getDate() + 1)
  }

  return stats
}
