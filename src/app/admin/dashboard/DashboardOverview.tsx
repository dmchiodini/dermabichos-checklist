'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getDashboardStats, DashboardStats } from '@/app/actions/dashboard'
import { format, subDays, startOfMonth, startOfYear, endOfMonth, endOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart3, Bath, ClipboardCheck, Dog } from 'lucide-react'

const COLORS = ['#e6789e', '#3f8ab3', '#e0e0e0'] // Rosa, Azul, Cinza

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

      const statsData = await getDashboardStats(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      
      setStats(statsData)
      setLoading(false)
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

  const especieData = [
    { name: 'Canina', value: stats?.canina || 0 },
    { name: 'Felina', value: stats?.felina || 0 }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 rounded-2xl border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Volume de Banhos</CardTitle>
            <CardDescription>Quantidade de checklists ao longo do período selecionado</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.volumeDiario}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="total" name="Banhos" stroke="#3f8ab3" strokeWidth={4} dot={{r: 4, fill: '#3f8ab3'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Proporção de concluídos</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {stats && stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#16a34a" /> {/* Green */}
                    <Cell fill="#f59e0b" /> {/* Amber */}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-center">Sem dados no período</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle>Ranking de Funcionários (Operacional)</CardTitle>
          <CardDescription>Quantidade de banhos finalizados por funcionário</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          {stats && stats.porFuncionario.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.porFuncionario} layout="vertical" margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{fill: '#1b3244', fontWeight: 600}} width={120} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="finalizados" name="Finalizados" fill="#e6789e" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-muted-foreground">Nenhum funcionário operacional realizou banhos neste período.</div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
