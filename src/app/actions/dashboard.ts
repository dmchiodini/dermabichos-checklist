'use server'

import { createClient } from '@/lib/supabase/server'

export type DashboardStats = {
  total: number
  finalizados: number
  abertos: number
  canina: number
  felina: number
  porFuncionario: { nome: string; finalizados: number }[]
  volumeDiario: { dia: string; total: number }[]
}

export async function getDashboardStats(startDate: string, endDate: string): Promise<DashboardStats> {
  const supabase = await createClient()

  // Fetch all checklists within the date range
  // Assuming 'created_at' is used for date filtering
  let query = supabase
    .from('checklists')
    .select('*, realizado_por_id')
    .gte('created_at', `${startDate}T00:00:00.000Z`)
    .lte('created_at', `${endDate}T23:59:59.999Z`)

  const { data: checklists, error } = await query

  if (error || !checklists) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return { total: 0, finalizados: 0, abertos: 0, canina: 0, felina: 0, porFuncionario: [], volumeDiario: [] }
  }

  // Fetch employees to map names
  const { data: funcionarios } = await supabase.from('funcionarios').select('id, nome, cargo').eq('role', 'operacional')

  const stats: DashboardStats = {
    total: checklists.length,
    finalizados: 0,
    abertos: 0,
    canina: 0,
    felina: 0,
    porFuncionario: [],
    volumeDiario: []
  }

  const funcMap: Record<string, { nome: string; finalizados: number }> = {}
  if (funcionarios) {
    funcionarios.forEach(f => {
      funcMap[f.id] = { nome: f.nome, finalizados: 0 }
    })
  }

  const volumeMap: Record<string, number> = {}

  checklists.forEach(c => {
    if (c.status === 'Excluido') return

    // Status
    if (c.status === 'Finalizado') {
      stats.finalizados++
      // If finished, count for the employee who did it
      if (c.realizado_por_id && funcMap[c.realizado_por_id]) {
        funcMap[c.realizado_por_id].finalizados++
      }
    } else {
      stats.abertos++
    }

    // Specie
    if (c.especie === 'Canina') stats.canina++
    if (c.especie === 'Felina') stats.felina++

    // Daily volume
    const dateStr = new Date(c.created_at).toISOString().split('T')[0]
    volumeMap[dateStr] = (volumeMap[dateStr] || 0) + 1
  })

  stats.total = stats.finalizados + stats.abertos
  stats.porFuncionario = Object.values(funcMap).sort((a, b) => b.finalizados - a.finalizados)

  // Generate an array of dates from startDate to endDate to ensure 0s are included in volumeDiario
  const current = new Date(startDate)
  const end = new Date(endDate)
  current.setUTCHours(12, 0, 0, 0) // prevent timezone shifts
  end.setUTCHours(12, 0, 0, 0)
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    stats.volumeDiario.push({
      dia: dateStr.split('-').reverse().slice(0, 2).join('/'), // DD/MM
      total: volumeMap[dateStr] || 0
    })
    current.setDate(current.getDate() + 1)
  }

  return stats
}
