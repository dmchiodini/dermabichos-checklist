import React from 'react'
import Image from 'next/image'
import { LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic' // Ensure it always fetches fresh data

export default async function DashboardPage(props: { searchParams: Promise<{ date?: string, search?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Calculate today's date correctly adjusting for local timezone
  const today = new Date()
  const localDateStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
  
  const dateFilter = searchParams.date || localDateStr
  const searchFilter = searchParams.search || ''

  // Parse YYYY-MM-DD reliably in local time
  const [year, month, day] = dateFilter.split('-').map(Number)
  const startDate = new Date(year, month - 1, day, 0, 0, 0, 0)
  const endDate = new Date(year, month - 1, day, 23, 59, 59, 999)

  let query = supabase
    .from('checklists')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })

  if (searchFilter) {
    query = query.or(`pet_nome.ilike.%${searchFilter}%,tutor.ilike.%${searchFilter}%`)
  }

  const { data: checklists } = await query

  const { data: funcionarios } = await supabase
    .from('funcionarios')
    .select('*')
    .order('nome')

  const { data: tiposHidratacao } = await supabase
    .from('tipos_hidratacao')
    .select('*')
    .order('nome')

  return (
    <div className="min-h-screen bg-espuma">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Image src="/dermabichos-logo.svg" alt="" width={48} height={48} className="size-12 rounded-full ring-2 ring-accent" />
            <div>
              <p className="font-heading text-lg leading-tight font-bold">Dermabichos</p>
              <p className="text-sm text-muted-foreground">Painel administrativo</p>
            </div>
          </div>
          <form action={logout}>
            <Button variant="ghost" type="submit" className="h-10 rounded-xl px-3 text-base font-semibold text-muted-foreground">
              <LogOut className="size-4" aria-hidden />
              Sair
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <DashboardClient
          initialChecklists={checklists || []}
          initialFuncionarios={funcionarios || []}
          initialTiposHidratacao={tiposHidratacao || []}
        />
      </main>
    </div>
  )
}
