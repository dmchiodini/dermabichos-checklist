import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { KeyRound, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdminPage } from '@/lib/auth/session'
import { isChecklistStatus, STATUS_EXCLUIDO } from '@/lib/auth/permissions'
import { endOfLocalDay, isISODate, startOfLocalDay, todayLocalISODate } from '@/lib/dates'
import { buildPetTutorSearchFilter } from '@/lib/validation'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic' // Ensure it always fetches fresh data

export default async function DashboardPage(props: {
  searchParams: Promise<{
    date?: string
    startDate?: string
    endDate?: string
    status?: string
    search?: string
    tab?: string
  }>
}) {
  const searchParams = await props.searchParams
  await requireAdminPage()
  const supabase = createAdminClient()

  const today = todayLocalISODate()
  const pickDate = (...candidates: (string | undefined)[]) => candidates.find(isISODate) ?? today

  const startDateParam = pickDate(searchParams.startDate, searchParams.date)
  const endDateParam = pickDate(searchParams.endDate, searchParams.startDate, searchParams.date)
  const searchFilter = searchParams.search || ''
  const statusFilter = searchParams.status || 'todos'

  // Se as datas vierem invertidas, troca a ordem
  const [firstDate, lastDate] = startDateParam <= endDateParam ? [startDateParam, endDateParam] : [endDateParam, startDateParam]
  const start = startOfLocalDay(firstDate)
  const end = endOfLocalDay(lastDate)

  let query = supabase
    .from('checklists')
    .select('*')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false })

  if (isChecklistStatus(statusFilter) || statusFilter === STATUS_EXCLUIDO) {
    query = query.eq('status', statusFilter)
  }

  const orFilter = searchFilter ? buildPetTutorSearchFilter(searchFilter) : null
  if (orFilter) {
    query = query.or(orFilter)
  }

  const [{ data: checklists }, { data: funcionarios }, { data: tiposHidratacao }] = await Promise.all([
    query,
    // Nunca enviar a coluna "senha" para o navegador
    supabase.from('funcionarios').select('id, nome, cargo, role, login, foto_url, ativo, created_at').order('nome'),
    supabase.from('tipos_hidratacao').select('*').order('nome'),
  ])

  return (
    <div className="min-h-screen bg-espuma">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <Image src="/dermabichos-icon.svg" alt="" width={48} height={48} className="size-12 rounded-full ring-2 ring-accent" />
            <div>
              <p className="font-heading text-lg leading-tight font-bold">Dermabichos</p>
              <p className="text-sm text-muted-foreground">Painel administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/admin/redefinir-senha"
              className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-base font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <KeyRound className="size-4" aria-hidden />
              <span className="hidden sm:inline">Alterar senha</span>
            </Link>
            <form action={logout}>
              <Button variant="ghost" type="submit" className="h-10 rounded-xl px-3 text-base font-semibold text-muted-foreground">
                <LogOut className="size-4" aria-hidden />
                Sair
              </Button>
            </form>
          </div>
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
