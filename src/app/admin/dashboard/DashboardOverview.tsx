'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getDashboardStats, DashboardStats } from '@/app/actions/dashboard'
import { format, subDays, startOfMonth, startOfYear, endOfMonth, endOfYear } from 'date-fns'

// Cores da identidade (mesmos valores de globals.css)
const BRAND = {
  ceu: '#79b7de',
  ceuDeep: '#2b6a92',
  rosa: '#cd8da7',
  tinta: '#1b3244',
  muted: '#5b7286',
  border: '#dbe7f0',
}
const tooltipStyle = { borderRadius: '12px', border: `1px solid ${BRAND.border}`, boxShadow: '0 8px 24px -12px rgb(27 50 68 / 0.25)' }
import { BarChart3, Bath, ClipboardCheck, Dog } from 'lucide-react'

export default function DashboardOverview() {
  const [period, setPeriod] = useState('mes')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const today = new Date()
      let startDate = new Date()
      let endDate = new Date()

      if (period === 'hoje') {
        // keep both today
      } else if (period === 'semana') {
        startDate = subDays(today, 7)
      } else if (period === 'mes') {
        startDate = startOfMonth(today)
        endDate = endOfMonth(today)
      } else if (period === 'ano') {
        startDate = startOfYear(today)
        endDate = endOfYear(today)
      }

      try {
        // Data local (toISOString usaria UTC e viraria o dia após as 21h no Brasil)
        const statsData = await getDashboardStats(
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        )
        setStats(statsData)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [period])

  if (!stats && loading) {
    return <div className="py-20 flex justify-center"><div className="size-12 animate-spin rounded-full border-4 border-ceu border-t-transparent" /></div>
  }

  const statusData = [
    { name: 'Finalizados', value: stats?.finalizados || 0 },
    { name: 'Em andamento', value: stats?.abertos || 0 }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-foreground">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">Estatísticas e métricas do sistema</p>
        </div>
        <Select value={period} onValueChange={(val) => setPeriod(val || 'mes')}>
          <SelectTrigger className="w-full sm:w-[200px] h-12 bg-muted/50 border-none font-semibold">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Últimos 7 dias</SelectItem>
            <SelectItem value="mes">Este mês</SelectItem>
            <SelectItem value="ano">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && <div className="h-1 bg-ceu/20 w-full rounded-full overflow-hidden"><div className="h-full bg-ceu w-1/2 animate-pulse" /></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Bath className="size-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold text-muted-foreground">Total de Banhos</CardDescription>
            <CardTitle className="text-4xl text-ceu-deep">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-green-600">
            <ClipboardCheck className="size-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold text-muted-foreground">Finalizados</CardDescription>
            <CardTitle className="text-4xl text-green-600">{stats?.finalizados || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500">
            <BarChart3 className="size-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold text-muted-foreground">Em andamento</CardDescription>
            <CardTitle className="text-4xl text-amber-500">{stats?.abertos || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-rosa">
            <Dog className="size-16" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-semibold text-muted-foreground">Canina vs Felina</CardDescription>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground">{stats?.canina || 0}</span>
              <span className="text-sm text-muted-foreground mb-1">Cães</span>
              <span className="text-muted-foreground/30 mx-1">|</span>
              <span className="text-2xl font-bold text-foreground">{stats?.felina || 0}</span>
              <span className="text-sm text-muted-foreground mb-1">Gatos</span>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Volume de Banhos ocupando a largura total */}
      <Card className="rounded-2xl border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Volume de Banhos</CardTitle>
          <CardDescription>Quantidade de checklists ao longo do período selecionado</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.volumeDiario} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BRAND.border} />
              <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fill: BRAND.muted, fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: BRAND.muted, fontSize: 12}} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'rgb(121 183 222 / 0.12)' }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="total" name="Banhos" fill={BRAND.ceuDeep} radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Ranking de Funcionários e Status lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Ranking de Funcionários (Operacional)</CardTitle>
            <CardDescription>Quantidade de banhos finalizados por funcionário</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {stats && stats.porFuncionario.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.porFuncionario} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke={BRAND.border} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: BRAND.muted}} allowDecimals={false} />
                  <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: BRAND.tinta, fontWeight: 600}} width={120} />
                  <Tooltip
                    cursor={{ fill: 'rgb(205 141 167 / 0.12)' }}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="finalizados" name="Finalizados" fill={BRAND.rosa} radius={[0, 6, 6, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum funcionário operacional realizou banhos neste período.</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Proporção de concluídos</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col items-center justify-center">
            {stats && stats.total > 0 ? (
              <>
                <div className="w-full h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#16a34a" /> {/* Green */}
                        <Cell fill="#f59e0b" /> {/* Amber */}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm font-semibold mt-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <span className="size-3 rounded-full bg-green-600 inline-block" />
                    <span>Finalizados ({stats.finalizados})</span>
                  </div>
                  <div className="flex items-center gap-2 text-amber-700">
                    <span className="size-3 rounded-full bg-amber-500 inline-block" />
                    <span>Em andamento ({stats.abertos})</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-center">Sem dados no período</div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
